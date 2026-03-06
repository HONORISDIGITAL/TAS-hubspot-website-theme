(() => {
    const modules = document.querySelectorAll('section.hero-section-form-yoco-module')
    if (!modules.length) return

    const SHORT_COURSES_ID_MARKER = 'short-courses'
    const APPLICATION_ID_FIELD = 'application_id'
    const APPLICATION_NAME_FIELD = 'application_name'
    const FIRSTNAME_FIELD = 'firstname'
    const LASTNAME_FIELD = 'lastname'
    const APPLICATION_ID_PARAM = 'application_id'
    const STATUS_PARAM = 'payment_status'
    const RETRY_PAYMENT_PARAM = 'retry_payment'
    const APPLICATION_ID_STORAGE_KEY = 'yoco_application_id'
    const STATUS_SUCCESS_VALUE = 'succeeded'
    const STATUS_FAILED_VALUE = 'failed'
    const CHECKOUT_ENDPOINT_DEFAULT = '/_hcms/api/yoco/checkout'
    const STATUS_READ_ENDPOINT_DEFAULT = '/_hcms/api/yoco/get-application-status'
    const PAYMENT_CURRENCY = 'ZAR'
    const STATUS_POLL_MAX_ATTEMPTS = 10
    const STATUS_POLL_DELAY_MS = 2000
    const APPLICATION_READY_MAX_ATTEMPTS = 12
    const APPLICATION_READY_DELAY_MS = 1000

    const setupModule = (moduleRoot) => {
        const paymentNode = moduleRoot.querySelector('[data-yoco-payment]')
        const paymentNodeLike = paymentNode || {
            getAttribute: () => '',
            setAttribute: () => {},
        }
        const errorEl = paymentNode ? paymentNode.querySelector('.payment-error') : null
        const statusEl = paymentNode ? paymentNode.querySelector('.payment-status') : null
        const resultWrapperEl = moduleRoot.querySelector('[data-payment-result-wrapper]')
        const successFeedbackEl = moduleRoot.querySelector('[data-payment-result-success]')
        const failureFeedbackEl = moduleRoot.querySelector('[data-payment-result-failure]')
        const pendingFeedbackEl = moduleRoot.querySelector('[data-payment-result-pending]')
        const state = { redirectInProgress: false, applicationId: '' }
        const retryButtonEl = moduleRoot.querySelector('[data-payment-retry]')
        const initialUrl = new URL(window.location.href)
        const initialStatus = (initialUrl.searchParams.get(STATUS_PARAM) || '').toString().trim().toLowerCase()
        const retryRequested = isTruthyParam(initialUrl.searchParams.get(RETRY_PAYMENT_PARAM))
        const endpoint = paymentNodeLike.getAttribute('data-endpoint') || CHECKOUT_ENDPOINT_DEFAULT
        const statusEndpoint = paymentNodeLike.getAttribute('data-status-read-endpoint') || STATUS_READ_ENDPOINT_DEFAULT
        const amount = Number(paymentNodeLike.getAttribute('data-amount') || 0)
        const currency = PAYMENT_CURRENCY
        const description = paymentNodeLike.getAttribute('data-description') || ''
        const applicationIdParam = APPLICATION_ID_PARAM
        const statusParam = STATUS_PARAM
        const successValue = STATUS_SUCCESS_VALUE
        const failedValue = STATUS_FAILED_VALUE
        const requireApplicationId = true
        const baseSuccessUrl = paymentNodeLike.getAttribute('data-success-url') || ''
        const baseCancelUrl = paymentNodeLike.getAttribute('data-failure-url')
            || paymentNodeLike.getAttribute('data-cancel-url')
            || ''
        function toggleHiddenClass(node, shouldHide) {
            if (!node) return
            node.classList.toggle('is-hidden', Boolean(shouldHide))
        }

        function setPaymentResultState(mode) {
            const normalizedMode = ['pending', 'succeeded', 'failed'].includes(mode) ? mode : 'hidden'
            if (resultWrapperEl) {
                resultWrapperEl.hidden = normalizedMode === 'hidden'
            }
            moduleRoot.classList.toggle('is-payment-result', normalizedMode !== 'hidden')
            moduleRoot.classList.toggle('is-payment-pending', normalizedMode === 'pending')
            toggleHiddenClass(successFeedbackEl, normalizedMode !== 'succeeded')
            toggleHiddenClass(failureFeedbackEl, normalizedMode !== 'failed')
            toggleHiddenClass(pendingFeedbackEl, normalizedMode !== 'pending')
        }

        function setInlinePaymentLoading(isLoading) {
            if (!paymentNode || !statusEl) return
            statusEl.innerHTML = isLoading
                ? '<span class="payment-inline-spinner" aria-hidden="true"></span>'
                : ''
        }

        function setRetryButtonVisible(visible) {
            if (!retryButtonEl) return
            retryButtonEl.classList.toggle('is-hidden', !visible)
        }

        function clearRetryRequestParam() {
            const url = new URL(window.location.href)
            if (!url.searchParams.has(RETRY_PAYMENT_PARAM)) return
            url.searchParams.delete(RETRY_PAYMENT_PARAM)
            window.history.replaceState({}, document.title, url.toString())
        }

        function cacheApplicationId(value) {
            const normalized = (value || '').toString().trim()
            if (!normalized) return ''
            state.applicationId = normalized
            paymentNodeLike.setAttribute('data-application-id', normalized)
            return normalized
        }

        function syncAndCacheApplicationId(formApi) {
            const resolved = ensureApplicationId(moduleRoot, paymentNodeLike, formApi)
            return cacheApplicationId(resolved)
        }

        function syncAndCacheApplicationName(formApi) {
            return ensureApplicationName(moduleRoot, paymentNodeLike, formApi, moduleRoot)
        }

        function resolveRetryApplicationId() {
            return state.applicationId
                || resolveApplicationId(moduleRoot, paymentNodeLike)
                || readCachedApplicationIdForReturn()
                || ''
        }

        function shouldSyncApplicationNameFromTarget(target) {
            if (!target || typeof target.name !== 'string') return false
            const fieldName = target.name
            return fieldName === FIRSTNAME_FIELD
                || fieldName === LASTNAME_FIELD
                || fieldName.endsWith(`/${FIRSTNAME_FIELD}`)
                || fieldName.endsWith(`/${LASTNAME_FIELD}`)
        }

        function onNameFieldInteraction(event) {
            if (!shouldSyncApplicationNameFromTarget(event.target)) return
            syncAndCacheApplicationName(null)
        }

        async function startPayment(applicationId, options = {}) {
            const pendingMode = options.pendingMode === 'result' ? 'result' : 'inline'
            const useResultPending = pendingMode === 'result'
            if (state.redirectInProgress) return
            if (!paymentNode) return
            if (!endpoint) {
                errorEl.textContent = 'Missing payment endpoint.'
                return
            }
            if (!amount || amount <= 0) {
                errorEl.textContent = 'Invalid payment amount.'
                return
            }
            if (requireApplicationId && !applicationId) {
                errorEl.textContent = 'Missing application ID.'
                return
            }

            state.redirectInProgress = true
            errorEl.textContent = ''
            if (useResultPending) {
                setPaymentResultState('pending')
            } else {
                setInlinePaymentLoading(true)
            }

            try {
                const applicationReady = await waitForApplicationReady(statusEndpoint, applicationId)
                if (!applicationReady) {
                    throw new Error('Application is still being saved. Please wait a few seconds and try again.')
                }

                const successUrl = baseSuccessUrl
                    ? appendParams(baseSuccessUrl, {
                        [applicationIdParam]: applicationId,
                        [statusParam]: successValue,
                    })
                    : buildReturnUrl(statusParam, successValue, applicationIdParam, applicationId)

                const cancelUrl = baseCancelUrl
                    ? appendParams(baseCancelUrl, {
                        [applicationIdParam]: applicationId,
                        [statusParam]: failedValue,
                    })
                    : buildReturnUrl(statusParam, failedValue, applicationIdParam, applicationId)

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        currency,
                        description,
                        successUrl,
                        cancelUrl,
                        applicationId,
                        applicationIdParam,
                        statusParam,
                        statusSuccessValue: successValue,
                        statusFailedValue: failedValue,
                    }),
                })

                if (!res.ok) {
                    const text = await res.text()
                    throw new Error(text || 'Payment request failed.')
                }

                const data = await res.json()
                const redirectUrl = data.redirectUrl || data.redirect_url
                if (!redirectUrl) {
                    throw new Error('Missing redirect URL.')
                }

                cacheApplicationIdForReturn(applicationId)
                window.location.href = redirectUrl
            } catch (err) {
                errorEl.textContent = err.message || 'Payment request failed.'
                if (useResultPending) {
                    setPaymentResultState('failed')
                    setRetryButtonVisible(Boolean(resolveRetryApplicationId()))
                } else {
                    setInlinePaymentLoading(false)
                }
            } finally {
                state.redirectInProgress = false
            }
        }

        async function startPaymentFromRetryContext() {
            const applicationId = cacheApplicationId(resolveRetryApplicationId())
            if (!applicationId) {
                if (errorEl) errorEl.textContent = 'Missing application ID.'
                return
            }
            await startPayment(applicationId, { pendingMode: 'result' })
        }

        function retryButtonHandler(event) {
            event.preventDefault()
            startPaymentFromRetryContext()
        }

        function handleFormReady(event) {
            const formApi = window.HubSpotFormsV4 && typeof window.HubSpotFormsV4.getFormFromEvent === 'function'
                ? window.HubSpotFormsV4.getFormFromEvent(event)
                : null
            syncAndCacheApplicationId(formApi)
            syncAndCacheApplicationName(formApi)
            ;[150, 800, 2000].forEach((delay) => {
                window.setTimeout(() => {
                    syncAndCacheApplicationName(null)
                }, delay)
            })
        }

        function handleFormStepNavigation(event) {
            const formApi = window.HubSpotFormsV4 && typeof window.HubSpotFormsV4.getFormFromEvent === 'function'
                ? window.HubSpotFormsV4.getFormFromEvent(event)
                : null
            syncAndCacheApplicationId(formApi)
            syncAndCacheApplicationName(formApi)
        }

        function handleFormSubmitSuccess(event) {
            const formApi = window.HubSpotFormsV4 && typeof window.HubSpotFormsV4.getFormFromEvent === 'function'
                ? window.HubSpotFormsV4.getFormFromEvent(event)
                : null
            const applicationId = state.applicationId || syncAndCacheApplicationId(formApi)
            syncAndCacheApplicationName(formApi)
            startPayment(applicationId, { pendingMode: 'inline' })
        }

        if (retryButtonEl) {
            retryButtonEl.addEventListener('click', retryButtonHandler)
        }

        cacheApplicationId(resolveApplicationId(moduleRoot, paymentNodeLike))
        setPaymentResultState(initialStatus || retryRequested ? 'pending' : 'hidden')

        if (paymentNode) {
            handleReturnStatus(moduleRoot, paymentNode, errorEl, setPaymentResultState).then((resolvedStatus) => {
                if (resolvedStatus === STATUS_FAILED_VALUE) {
                    setRetryButtonVisible(Boolean(resolveRetryApplicationId()))
                    if (retryRequested) {
                        clearRetryRequestParam()
                        startPaymentFromRetryContext()
                    }
                    return
                }
                setRetryButtonVisible(false)
                if (!initialStatus && retryRequested) {
                    clearRetryRequestParam()
                    setPaymentResultState('pending')
                    startPaymentFromRetryContext()
                }
            }).catch(() => {
                setRetryButtonVisible(false)
            })
        }

        window.addEventListener('hs-form-event:on-ready', handleFormReady)
        window.addEventListener('hs-form-event:on-interaction:navigate', handleFormStepNavigation)
        window.addEventListener('hs-form-event:on-submission:success', handleFormSubmitSuccess)
        moduleRoot.addEventListener('input', onNameFieldInteraction, true)
        moduleRoot.addEventListener('change', onNameFieldInteraction, true)
    }

    modules.forEach(setupModule)

    function isTruthyParam(value) {
        return ['1', 'true', 'yes', 'y'].includes((value || '').toString().trim().toLowerCase())
    }

    function readInputValue(scope, fieldName) {
        if (!scope || !fieldName) return ''
        const escapedFieldName = window.CSS && window.CSS.escape ? window.CSS.escape(fieldName) : fieldName
        const input = scope.querySelector(`input[name="${escapedFieldName}"]`) || scope.querySelector(`input[name$="/${escapedFieldName}"]`)
        return input ? input.value.trim() : ''
    }

    function findInput(scope, fieldName) {
        if (!scope || !fieldName) return null
        const escapedFieldName = window.CSS && window.CSS.escape ? window.CSS.escape(fieldName) : fieldName
        return scope.querySelector(`input[name="${escapedFieldName}"]`) || scope.querySelector(`input[name$="/${escapedFieldName}"]`)
    }

    function getResolvedFieldName(scope, fieldName) {
        const input = findInput(scope, fieldName)
        return input && input.name ? input.name : fieldName
    }

    function setInputValue(scope, fieldName, value) {
        if (!scope || !fieldName || !value) return false
        const escapedFieldName = window.CSS && window.CSS.escape ? window.CSS.escape(fieldName) : fieldName
        const input = scope.querySelector(`input[name="${escapedFieldName}"]`) || scope.querySelector(`input[name$="/${escapedFieldName}"]`)
        if (!input) return false
        input.value = value
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
        return true
    }

    function generateApplicationId() {
        return `${SHORT_COURSES_ID_MARKER}-${Date.now()}-${Math.floor(Math.random() * 9999)}`
    }

    function resolveApplicationId(scope, paymentNode) {
        const fromInput = readInputValue(scope, APPLICATION_ID_FIELD)
        const fromDocument = readInputValue(document, APPLICATION_ID_FIELD)
        const fromData = paymentNode.getAttribute('data-application-id') || ''
        const fromUrl = new URL(window.location.href).searchParams.get(APPLICATION_ID_PARAM) || ''
        return fromInput || fromDocument || fromData || fromUrl || ''
    }

    function ensureApplicationId(scope, paymentNode, formApi) {
        let input = findInput(scope, APPLICATION_ID_FIELD) || findInput(document, APPLICATION_ID_FIELD)
        let applicationId = resolveApplicationId(scope, paymentNode)
        if (!applicationId) {
            applicationId = generateApplicationId()
            paymentNode.setAttribute('data-application-id', applicationId)
        }

        const resolvedFieldName = getResolvedFieldName(scope, APPLICATION_ID_FIELD)
        if (input) {
            setInputValue(scope, resolvedFieldName, applicationId)
            if (resolvedFieldName !== APPLICATION_ID_FIELD) {
                setInputValue(scope, APPLICATION_ID_FIELD, applicationId)
            }
            if (!input.value) {
                input = findInput(scope, APPLICATION_ID_FIELD) || findInput(document, APPLICATION_ID_FIELD)
            }
        }

        if (formApi && typeof formApi.setFieldValue === 'function') {
            try {
                formApi.setFieldValue(resolvedFieldName, applicationId)
            } catch {}
        }
        return applicationId
    }

    function resolveProgramName(moduleRoot, paymentNode) {
        const fromPaymentNode = (paymentNode && typeof paymentNode.getAttribute === 'function'
            ? paymentNode.getAttribute('data-short-course-name')
            : '') || ''
        const fromModuleRoot = (moduleRoot && typeof moduleRoot.getAttribute === 'function'
            ? moduleRoot.getAttribute('data-program-name')
            : '') || ''
        return (fromPaymentNode || fromModuleRoot || '').toString().trim()
    }

    function buildApplicationName(scope, paymentNode, moduleRoot) {
        const firstName = readInputValue(scope, FIRSTNAME_FIELD) || readInputValue(document, FIRSTNAME_FIELD)
        const lastName = readInputValue(scope, LASTNAME_FIELD) || readInputValue(document, LASTNAME_FIELD)
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
        const programName = resolveProgramName(moduleRoot, paymentNode)

        if (fullName && programName) return `${fullName} - ${programName}`
        if (fullName) return fullName
        return programName
    }

    function ensureApplicationName(scope, paymentNode, formApi, moduleRoot) {
        const value = buildApplicationName(scope, paymentNode, moduleRoot)
        if (!value) return ''

        const input = findInput(scope, APPLICATION_NAME_FIELD) || findInput(document, APPLICATION_NAME_FIELD)
        const resolvedFieldName = getResolvedFieldName(scope, APPLICATION_NAME_FIELD)
        if (input) {
            setInputValue(scope, resolvedFieldName, value)
            if (resolvedFieldName !== APPLICATION_NAME_FIELD) {
                setInputValue(scope, APPLICATION_NAME_FIELD, value)
            }
        }

        if (formApi && typeof formApi.setFieldValue === 'function') {
            try {
                formApi.setFieldValue(resolvedFieldName, value)
            } catch {}
        }
        return value
    }

    function appendParams(baseUrl, params) {
        if (!baseUrl) return ''
        let url
        try {
            url = new URL(baseUrl, window.location.origin)
        } catch {
            return baseUrl
        }
        Object.entries(params || {}).forEach(([key, value]) => {
            if (!key || value === undefined || value === null || value === '') return
            url.searchParams.set(key, value)
        })
        return url.toString()
    }

    function buildReturnUrl(statusParam, statusValue, applicationIdParam, applicationId) {
        const url = new URL(window.location.href)
        if (statusParam && statusValue) {
            url.searchParams.set(statusParam, statusValue)
        }
        if (applicationIdParam && applicationId) {
            url.searchParams.set(applicationIdParam, applicationId)
        }
        return url.toString()
    }

    async function callStatusRead(statusEndpoint, payload, errorEl) {
        if (!statusEndpoint) return null
        try {
            const res = await fetch(statusEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const text = await res.text()
                if (res.status === 404) {
                    try {
                        const parsed = JSON.parse(text)
                        if (parsed && parsed.found === false) {
                            return parsed
                        }
                    } catch {}
                }
                throw new Error(text || 'Status update failed.')
            }
            return await res.json()
        } catch (err) {
            if (errorEl) {
                errorEl.textContent = err.message || 'Status update failed.'
            }
        }
        return null
    }

    function sleep(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms))
    }

    async function waitForApplicationReady(statusEndpoint, applicationId) {
        if (!statusEndpoint || !applicationId) return false
        for (let attempt = 0; attempt < APPLICATION_READY_MAX_ATTEMPTS; attempt += 1) {
            const data = await callStatusRead(statusEndpoint, { applicationId }, null)
            if (data && data.found) return true
            if (attempt < APPLICATION_READY_MAX_ATTEMPTS - 1) {
                await sleep(APPLICATION_READY_DELAY_MS)
            }
        }
        return false
    }

    function cacheApplicationIdForReturn(applicationId) {
        const value = (applicationId || '').toString().trim()
        if (!value) return
        try {
            window.sessionStorage.setItem(APPLICATION_ID_STORAGE_KEY, value)
        } catch {}
    }

    function readCachedApplicationIdForReturn() {
        try {
            return (window.sessionStorage.getItem(APPLICATION_ID_STORAGE_KEY) || '').toString().trim()
        } catch {
            return ''
        }
    }

    function clearCachedApplicationIdForReturn() {
        try {
            window.sessionStorage.removeItem(APPLICATION_ID_STORAGE_KEY)
        } catch {}
    }

    async function handleReturnStatus(moduleRoot, paymentNode, errorEl, setPaymentResultState) {
        const url = new URL(window.location.href)
        const status = url.searchParams.get(STATUS_PARAM)
        if (!status) return ''

        const applicationId = url.searchParams.get(APPLICATION_ID_PARAM) || readCachedApplicationIdForReturn()
        if (!applicationId) return ''

        const statusEndpoint = paymentNode.getAttribute('data-status-read-endpoint') || STATUS_READ_ENDPOINT_DEFAULT
        if (!statusEndpoint) return ''

        setPaymentResultState('pending')
        let resolvedStatus = status || ''
        for (let attempt = 0; attempt < STATUS_POLL_MAX_ATTEMPTS; attempt += 1) {
            const data = await callStatusRead(statusEndpoint, { applicationId }, errorEl)
            if (data && data.found === false) {
                break
            }
            resolvedStatus = (data && (data.yoco_payment_status || data.yoko_payment_status || data.payment_status || data.status)) || resolvedStatus || ''
            if (resolvedStatus && resolvedStatus !== 'awaiting') break
            if (attempt < STATUS_POLL_MAX_ATTEMPTS - 1) {
                await sleep(STATUS_POLL_DELAY_MS)
            }
        }

        if (resolvedStatus === STATUS_SUCCESS_VALUE) {
            setPaymentResultState('succeeded')
            clearCachedApplicationIdForReturn()
        } else if (resolvedStatus === STATUS_FAILED_VALUE) {
            setPaymentResultState('failed')
            clearCachedApplicationIdForReturn()
        } else {
            setPaymentResultState('pending')
        }

        url.searchParams.delete(STATUS_PARAM)
        url.searchParams.delete(APPLICATION_ID_PARAM)
        window.history.replaceState({}, document.title, url.toString())
        return resolvedStatus
    }
})()
