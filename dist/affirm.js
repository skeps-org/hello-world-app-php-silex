if (!MINIBC) var MINIBC = {};
(function ($, mbc) {
    mbc.remoteUrl = "https://apps.minibc.com";
    mbc.request = function (data, path, method, dataType, domain, options) {
        data.storeID = "K1IvM1R4NjBDOFJtWHhzS0hJWkF6UT09LklEOHNrOVFBYVF0eUhCbUd5SzR3QWc9PQEQUALSEQUALS";
        data.token = "5f7db7d038db4";
        if (!domain) domain = mbc.remoteUrl;
        options = options || {};
        var defaults = { url: domain + path, type: method, async: true, data: data, dataType: dataType };
        if (options) {
            $.each(options, function (key, val) {
                defaults[key] = val;
            });
        }
        return $.ajax(defaults);
    };
    mbc.getUrlParam = function (name) {
        var search = window.location.search,
            regex = new RegExp("(\\?|&)" + name + "=([^&]+)", "g");
        if (!search || search.length <= 0) return false;
        var results = regex.exec(search);
        if (results && results.length > 2) {
            return results[2];
        }
        return false;
    };
    mbc.getCustomerToken = function (clientId) {
        var deferred = new $.Deferred();
        $.ajax({ url: "/customer/current.jwt?app_client_id=" + clientId, type: "POST", dataType: "json", global: false }).pipe(
            function (resp) {
                deferred.resolve(resp.token);
            },
            function (err) {
                deferred.reject(err);
            }
        );
        return deferred.promise();
    };
    mbc.verifyCustomerToken = function (appId, token) {
        return mbc.request({ customer_token: token, id: appId }, "/auth/customer/verify", "POST", "json");
    };
    mbc.getCookie = function (cname) {
        var name = cname + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == " ") c = c.substring(1);
            if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
        }
        return "";
    };
    mbc.getURLParameter = function (name) {
        return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(location.search) || [null, ""])[1].replace(/\+/g, "%20")) || null;
    };
    mbc.Log = function () {
        var logLevel = "debug";
        var levels = ["debug", "info", "warn", "error"];
        var features = { console: false, consoleDebug: false, consoleInfo: false, consoleWarn: false, consoleError: false };
        var appName;
        var detectBrowserFeatures = function () {
            features.console = typeof console !== "undefined";
            if (features.console) {
                features.consoleDebug = typeof console.debug !== "undefined";
                features.consoleInfo = typeof console.info !== "undefined";
                features.consoleWarn = typeof console.warn !== "undefined";
                features.consoleError = typeof console.error !== "undefined";
                features.consoleLog = typeof console.log !== "undefined";
            }
        };
        var formatMessage = function (message, type) {
            var formatted = "";
            if (appName) {
                formatted += "[" + appName + "]";
            } else {
                formatted += "[core]";
            }
            formatted += "[" + type + "] ";
            formatted += message;
            return formatted;
        };
        var logToConsole = function (type) {
            if (!features.console) {
                return false;
            }
            var verboseIndex = levels.indexOf(type);
            var verboseLevelIndex = levels.indexOf(logLevel);
            return verboseIndex >= verboseLevelIndex;
        };
        this.setAppName = function (name) {
            appName = name;
        };
        this.setVerbosity = function (level) {
            if (levels.indexOf(level) > -1) {
                logLevel = level;
            } else {
                this.error('Invalid verbosity level "' + level + '".');
            }
        };
        this.debug = function (message) {
            if (logToConsole("debug")) {
                var formatted = formatMessage(message, "debug");
                if (features.consoleDebug) {
                    console.debug(formatted);
                } else {
                    this.log(formatted, true);
                }
            }
        };
        this.info = function (message) {
            if (logToConsole("info")) {
                var formatted = formatMessage(message, "info");
                if (features.consoleInfo) {
                    console.info(formatted);
                } else {
                    this.log(formatted, true);
                }
            }
        };
        this.warn = function (message) {
            if (logToConsole("warn")) {
                var formatted = formatMessage(message, "warn");
                if (features.consoleWarn) {
                    console.warn(formatted);
                } else {
                    this.log(formatted, true);
                }
            }
        };
        this.error = function (message) {
            if (logToConsole("error")) {
                var formatted = formatMessage(message, "error");
                if (features.consoleError) {
                    console.error(formatted);
                } else {
                    this.log(formatted, true);
                }
            }
        };
        this.log = function (message, isFormatted) {
            if (features.consoleLog) {
                var formatted;
                if (!isFormatted) {
                    formatted = formatMessage(message, "log");
                } else {
                    formatted = message;
                }
                console.log(formatted);
            }
        };
        detectBrowserFeatures();
    };
    mbc.Events = {};
})(window.jQuery, MINIBC);
if (window.XDomainRequest) {
    jQuery.ajaxTransport(function (s) {
        if (s.crossDomain && s.async) {
            if (s.timeout) {
                s.xdrTimeout = s.timeout;
                delete s.timeout;
            }
            var xdr;
            return {
                send: function (_, complete) {
                    function callback(status, statusText, responses, responseHeaders) {
                        xdr.onload = xdr.onerror = xdr.ontimeout = xdr.onprogress;
                        xdr = undefined;
                        complete(status, statusText, responses, responseHeaders);
                    }
                    xdr = new XDomainRequest();
                    xdr.open(s.type, s.url);
                    xdr.onload = function () {
                        callback(200, "OK", { text: xdr.responseText }, "Content-Type: " + xdr.contentType);
                    };
                    xdr.onerror = function () {
                        callback(404, "Not Found");
                    };
                    xdr.onprogress = function () {
                        return;
                    };
                    xdr.ontimeout = function () {
                        callback(0, "timeout");
                    };
                    xdr.timeout = s.xdrTimeout || Number.MAX_VALUE;
                    setTimeout(function () {
                        xdr.send(s.hasContent && s.data ? s.data : null);
                    }, 0);
                },
                abort: function () {
                    if (xdr) {
                        xdr.onerror = jQuery.noop;
                        xdr.abort();
                    }
                },
            };
        }
    });
}
(function ($, mbcEvent) {
    mbcEvent.Checkout = { HandleResponse: jQuery.Event("checkout.handle_response"), _AfterHandleResponse: jQuery.Event("checkout.after_handle_response"), ConfirmPaymentProvider: jQuery.Event("checkout.confirm_payment_provider") };
})(window.jQuery, MINIBC.Events);
if (!"ExpressCheckout" in window) {
    var ExpressCheckout = {};
}
(function ($, mbcEvents) {
    var _signedIn = 0;
    var _digitalOrder = 0;
    var _currentStep = "AccountDetails";
    var useAddressValidation = false;
    var _chooseShipping = false;
    var _chooseBilling = false;
    if (typeof window.ExpressCheckout != "undefined") {
        if (typeof window.ExpressCheckout.currentStep != "undefined") {
            _signedIn = ExpressCheckout.signedIn;
            _digitalOrder = ExpressCheckout.digitalOrder;
            _currentStep = ExpressCheckout.currentStep;
            _chooseShipping = ExpressCheckout.ChooseShippingAddress;
            _chooseBilling = ExpressCheckout.ChooseBillingAddress;
        }
        if (typeof window.AVS != "undefined" && typeof window.AVS.displayErrorModal != "undefined") {
            useAddressValidation = true;
        }
    }
    ExpressCheckout = {
        completedSteps: new Array(),
        currentStep: "AccountDetails",
        signedIn: 0,
        digitalOrder: 0,
        createAccount: 0,
        anonymousCheckout: 0,
        checkoutLogin: 0,
        init: function () {
            if ($("#CheckoutStepAccountDetails").css("display") === "none") {
                ExpressCheckout.currentStep = "BillingAddress";
            } else {
                $("#BillingDetailsLabel").html(lang.ExpressCheckoutStepBillingAccountDetails);
            }
            $(".ExpressCheckoutBlock").hover(
                function () {
                    if ($(this).hasClass("ExpressCheckoutBlockCompleted")) {
                        $(this).css("cursor", "pointer");
                    }
                },
                function () {
                    $(this).css("cursor", "default");
                }
            );
            $(".ExpressCheckoutTitle").click(function () {
                if ($(this).hasClass("ExpressCheckoutBlockCompleted")) {
                    $(this).find(".ChangeLink").click();
                }
            });
            $(document).ajaxError(function (event, request, settings) {
                ExpressCheckout.HideLoadingIndicators();
                alert(lang.ExpressCheckoutLoadError);
            });
        },
        Login: function () {
            $("#CheckoutLoginError").hide();
            ExpressCheckout.anonymousCheckout = 0;
            ExpressCheckout.createAccount = 0;
            if (ExpressCheckout.validateEmailAddress($("#login_email").val()) === false) {
                alert(lang.LoginEnterValidEmail);
                $("#login_email").focus();
                $("#login_email").select();
                return false;
            }
            if ($("#login_pass").val() === "") {
                alert(lang.LoginEnterPassword);
                $("#login_pass").focus();
                return false;
            }
            ExpressCheckout.ShowLoadingIndicator("#LoginForm");
            $.ajax({ url: "remote.php", type: "post", dataType: "json", data: "w=expressCheckoutLogin&" + $("#LoginForm").serialize(), success: ExpressCheckout.HandleResponse });
            return false;
        },
        HandleResponse: function (response) {
            ExpressCheckout.HideLoadingIndicators();
            var _response = $("html").triggerHandler(mbcEvents.HandleResponse, [response]);
            if (typeof _response !== "undefined") {
                if (_response === false) {
                    return false;
                }
            } else {
                _response = response;
            }
            $.when(_response).done(function (respObj) {
                if (typeof respObj !== "undefined") response = respObj;
                if (response.completedSteps !== undefined) {
                    $.each(response.completedSteps, function () {
                        var value = document.createTextNode(this.message);
                        $("#CheckoutStep" + this.id + " .ExpressCheckoutCompletedContent").html(value);
                        $("#CheckoutStep" + this.id).addClass("ExpressCheckoutBlockCompleted");
                        ExpressCheckout.completedSteps[ExpressCheckout.completedSteps.length] = this.id;
                    });
                }
                if (response.stepContent !== undefined) {
                    $.each(response.stepContent, function () {
                        $("#CheckoutStep" + this.id + " .ExpressCheckoutContent").html(this.content);
                        $("#CheckoutStep" + this.id + " .ExpressCheckoutContent .FormField.JSHidden").show();
                    });
                }
                ExpressCheckout.HandleResponseStatus(response);
            });
        },
        HandleResponseStatus: function (response) {
            $("html").trigger("checkout:handle_response_status", [response]);
            if (response.status === 0) {
                if (response.errorContainer) {
                    $(response.errorContainer).html(response.errorMessage).show();
                } else {
                    if (typeof response.errorMessage !== "undefined") {
                        alert(response.errorMessage);
                    }
                }
            }
            if (response.changeStep) {
                ExpressCheckout.ChangeStep(response.changeStep);
                ExpressCheckout.ResetNextSteps();
            }
            if (response.focus) {
                try {
                    $(response.focus).focus().select();
                } catch (e) { }
            }
        },
        GuestCheckout: function () {
            var type;
            $("#CreateAccountForm").show();
            $("#CheckoutLoginError").hide();
            if ($("#CheckoutGuestForm").css("display") !== "none" && !$("#checkout_type_register:checked").val()) {
                type = "guest";
                ExpressCheckout.anonymousCheckout = 1;
                ExpressCheckout.createAccount = 0;
            } else {
                type = "account";
                ExpressCheckout.anonymousCheckout = 0;
                ExpressCheckout.createAccount = 1;
            }
            ExpressCheckout.ShowLoadingIndicator("#CheckoutGuestForm");
            $.ajax({ url: "remote.php", type: "post", dataType: "json", data: { w: "expressCheckoutGetAddressFields", type: type }, success: ExpressCheckout.HandleResponse });
        },
        ResetNextSteps: function () {
            var steps = ExpressCheckout.GetSteps();
            var beginReset = false;
            var newCompleted = [];
            $.each(steps, function (i, step) {
                if (step === ExpressCheckout.currentStep) {
                    newCompleted[newCompleted.length] = step;
                    beginReset = true;
                } else if (beginReset === true) {
                    $("#CheckoutStep" + step).removeClass("ExpressCheckoutBlockCompleted");
                    $("#CheckoutStep" + step + " .ExpressCheckoutCompletedContent").html("");
                }
            });
            ExpressCheckout.completedSteps = newCompleted;
        },
        ChangeStep: function (step) {
            var topAcc2;
            $("#bottom_payment_button").removeAttr("disabled");
            if (typeof step === "undefined") {
                step = ExpressCheckout.CalculateNextStep(ExpressCheckout.currentStep);
            }
            if (step === ExpressCheckout.currentStep) {
                return false;
            }
            $("#CheckoutStep" + ExpressCheckout.currentStep + " .ExpressCheckoutContent").slideUp("slow");
            $("#CheckoutStep" + ExpressCheckout.currentStep).addClass("ExpressCheckoutBlockCollapsed");
            if ($.inArray(ExpressCheckout.currentStep, ExpressCheckout.completedSteps) !== -1) {
                $("#CheckoutStep" + ExpressCheckout.currentStep).addClass("ExpressCheckoutBlockCompleted");
            }
            $("#CheckoutStep" + step + " .ExpressCheckoutContent").slideDown("slow", function () {
                if ($.inviewport !== undefined) {
                    var checkoutInViewport = $(this).find(".ExpressCheckoutTitle").is(":in-viewport");
                    if (!checkoutInViewport) {
                        topAcc2 = $(this).offset().top;
                        $("html, body").animate({ scrollTop: topAcc2 - 90 }, 600);
                    }
                }
            });
            $("#CheckoutStep" + step).removeClass("ExpressCheckoutBlockCollapsed");
            ExpressCheckout.currentStep = step;
            return false;
        },
        GetSteps: function () {
            var steps = new Array();
            if (ExpressCheckout.signedIn === 0) {
                steps[steps.length] = "AccountDetails";
            }
            steps[steps.length] = "BillingAddress";
            if (!ExpressCheckout.digitalOrder) {
                steps[steps.length] = "ShippingAddress";
                steps[steps.length] = "ShippingProvider";
            }
            steps[steps.length] = "Confirmation";
            steps[steps.length] = "PaymentDetails";
            return steps;
        },
        CalculateNextStep: function (currentStep) {
            var steps = ExpressCheckout.GetSteps();
            var nextStep = "";
            $.each(steps, function (i, step) {
                if (step === currentStep) {
                    nextStep = steps[i + 1];
                }
            });
            if (nextStep) {
                return nextStep;
            }
        },
        ChooseBillingAddress: function () {
            var addressType;
            if (!$("#BillingAddressTypeExisting:checked").val() || $("#ChooseBillingAddress").css("display") === "none") {
                if ((ExpressCheckout.anonymousCheckout || ExpressCheckout.createAccount) && !ExpressCheckout.ValidateNewAccount(true)) {
                    return false;
                }
                if (!ExpressCheckout.ValidateNewAddress("billing")) {
                    return false;
                }
                addressType = "new";
            } else if ($(".SelectBillingAddress select option:selected").val() === -1) {
                alert(lang.ExpressCheckoutChooseBilling);
                $(".SelectBillingAddress select").focus();
                return false;
            } else {
                addressType = "existing";
            }
            var createAppend = "";
            if (ExpressCheckout.createAccount) {
                createAppend = "&createAccount=1";
            }
            $("noscript").remove();
            $.ajax({
                url: "remote.php",
                type: "post",
                dataType: "json",
                data: "w=saveExpressCheckoutBillingAddress&" + $("#NewBillingAddress").serialize() + "&BillingAddressType=" + addressType + createAppend,
                success: ExpressCheckout.HandleResponse,
            });
            return false;
        },
        ChooseShippingAddress: function (copyBilling) {
            var addressType;
            if (!$("#ShippingAddressTypeExisting:checked").val() || $("#ChooseShippingAddress").css("display") === "none") {
                if (!ExpressCheckout.ValidateNewAddress("shipping")) {
                    return false;
                }
                addressType = "new";
            } else if ($(".SelectShippingAddress select option:selected").val() === -1) {
                alert(lang.ExpressCheckoutChooseShipping);
                $(".SelectShippingAddress select").focus();
                return false;
            } else {
                addressType = "existing";
            }
            $.ajax({
                url: "remote.php",
                type: "post",
                dataType: "json",
                data: "w=saveExpressCheckoutShippingAddress&" + $("#NewShippingAddress").serialize() + "&ShippingAddressType=" + addressType,
                success: ExpressCheckout.HandleResponse,
            });
            return false;
        },
        SetBillingAndShippingAddress: function () {
            if ($(".SelectBillingAddress select option:selected").html() === null) {
                return;
            }
            billingAddress = $(".SelectBillingAddress select option:selected").html().substring(0, 58);
            $("#CheckoutStepBillingAddress .ExpressCheckoutCompletedContent").html(billingAddress + "...");
            $("#CheckoutStepBillingAddress").addClass("ExpressCheckoutBlockCompleted");
            ExpressCheckout.ChooseShippingAddress();
            return false;
        },
        ChooseShippingProvider: function () {
            var shippingValid = true;
            if (!$("#CheckoutStepShippingProvider .ShippingProviderList input[type=radio]:checked").val()) {
                alert(lang.ExpressCheckoutChooseShipper);
                $("#CheckoutStepShippingProvider .ShippingProviderList input[type=radio]").get(0).focus();
                shippingValid = false;
                return false;
            }
            if (shippingValid === false) {
                return false;
            }
            $.ajax({ url: "remote.php", type: "post", dataType: "json", data: "w=saveExpressCheckoutShippingProvider&" + $("#CheckoutStepShippingProvider form").serialize(), success: ExpressCheckout.HandleResponse });
            return false;
        },
        ShowLoadingIndicator: function (step) {
            if (typeof step == "undefined") {
                step = "body";
            }
            $(step)
                .find(".ExpressCheckoutBlock input[type=submit]")
                .each(function () {
                    $(this).attr("oldValue", $(this).val());
                    $(this).val(lang.ExpressCheckoutLoading);
                    $(this).attr("disabled", true);
                });
            $(step).find(".LoadingIndicator").show();
            $("body").css("cursor", "wait");
        },
        HideLoadingIndicators: function () {
            HideLoadingIndicator();
            $(".ExpressCheckoutBlock input[type=submit]").each(function () {
                if ($(this).attr("oldValue") && $(this).attr("disabled") === true) {
                    $(this).val($(this).attr("oldValue"));
                    $(this).attr("disabled", false);
                }
            });
            $(".LoadingIndicator").hide();
            $("body").css("cursor", "default");
        },
        LoadOrderConfirmation: function () {
            postVars.w = "expressCheckoutShowConfirmation";
            $.ajax({ url: "remote.php", type: "post", dataType: "json", data: postVars, success: ExpressCheckout.HandleResponse });
        },
        HidePaymentForm: function () {
            $("#CheckoutStepPaymentDetails").hide();
            $("#CheckoutStepPaymentDetails .ExpressCheckoutContent").html("");
        },
        LoadPaymentForm: function (provider) {
            $.ajax({ url: "remote.php", data: "w=expressCheckoutLoadPaymentForm&" + $("#CheckoutStepConfirmation form").serialize(), dataType: "json", type: "post", success: ExpressCheckout.HandleResponse });
        },
        ShowSingleMethodPaymentForm: function () {
            $("#CheckoutStepPaymentDetails").show();
            ShowContinueButton();
        },
        ValidateNewAccount: function () {
            var password,
                confirmPassword,
                formfield = FormField.GetValues(CustomCheckoutFormNewAccount);
            for (var i = 0; i < formfield.length; i++) {
                if (formfield[i].privateId === "EmailAddress") {
                    if (ExpressCheckout.validateEmailAddress(formfield[i].value) === false) {
                        alert(lang.LoginEnterValidEmail);
                        FormField.Focus(formfield[i].field);
                        return false;
                    }
                }
                if (formfield[i].privateId === "Password") {
                    if (!ExpressCheckout.createAccount) {
                        continue;
                    }
                    password = formfield[i];
                } else if (formfield[i].privateId === "ConfirmPassword") {
                    if (!ExpressCheckout.createAccount) {
                        continue;
                    }
                    confirmPassword = formfield[i];
                }
                var rtn = FormField.Validate(formfield[i].field);
                if (!rtn.status) {
                    alert(rtn.msg);
                    FormField.Focus(formfield[i].field);
                    return false;
                }
            }
            if (ExpressCheckout.createAccount && password && password.value !== confirmPassword.value) {
                alert(lang.AccountPasswordsDontMatch);
                FormField.Focus(confirmPassword.field);
                return false;
            }
            return true;
        },
        BuildAddressLine: function (type) {
            var formId, i;
            var fieldList = { FirstName: "", LastName: "", Company: "", AddressLine1: "", City: "", State: "", Zip: "", Country: "" };
            if (type === "billing") {
                formId = CustomCheckoutFormBillingAddress;
            } else {
                formId = CustomCheckoutFormShippingAddress;
            }
            var formfields = FormField.GetValues(formId);
            var addressLine = "";
            for (i = 0; i < formfields.length; i++) {
                fieldList[formfields[i].privateId] = formfields[i].value;
            }
            for (var i in fieldList) {
                var val = fieldList[i];
                if (val !== "") {
                    if (addressLine !== "" && i !== "LastName") {
                        addressLine += ", ";
                    } else if (i === "LastName") {
                        addressLine += " ";
                    }
                    addressLine += val;
                }
            }
            return addressLine;
        },
        ValidateNewAddress: function (lowerType, resultOnly) {
            var formId;
            if (resultOnly !== true) {
                resultOnly = false;
            }
            if (lowerType === "billing") {
                formId = CustomCheckoutFormBillingAddress;
            } else {
                formId = CustomCheckoutFormShippingAddress;
            }
            var formfields = FormField.GetValues(formId);
            var hasErrors = false;
            for (var i = 0; i < formfields.length; i++) {
                var rtn = FormField.Validate(formfields[i].field);
                if (!rtn.status) {
                    if (!resultOnly) {
                        alert(rtn.msg);
                    }
                    FormField.Focus(formfields[i].field);
                    hasErrors = true;
                    return false;
                }
            }
            if (hasErrors === true) {
                return false;
            } else {
                return true;
            }
        },
        validateEmailAddress: function (email) {
            if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
                return false;
            }
            return true;
        },
        ToggleAddressType: function (address, type) {
            if (type === "Select") {
                $(".Select" + address + "Address").show();
                $(".Add" + address + "Address").hide();
            } else {
                $(".Add" + address + "Address").show();
                $(".Select" + address + "Address").hide();
            }
        },
        SelectedPaymentProvider: function () {
            var paymentProvider = "";
            if ($("#use_store_credit").css("display") !== "none") {
                if ($("#store_credit:checked").val()) {
                    if ($("#credit_provider_list").css("display") != "none") {
                        paymentProvider = $("#credit_provider_list input:checked");
                    }
                } else {
                    paymentProvider = $("#provider_list input:checked");
                }
            } else {
                paymentProvider = $("#provider_list input:checked");
            }
            return paymentProvider;
        },
        ConfirmPaymentProvider: function () {
            if ($(".CheckoutHideOrderTermsAndConditions").css("display") !== "none" && $("#AgreeTermsAndConditions").prop("checked") !== true) {
                alert(lang.TickArgeeTermsAndConditions);
                return false;
            }
            if (!confirm_payment_provider()) {
                return false;
            }
            var paymentProvider = ExpressCheckout.SelectedPaymentProvider();
            var _response = $("html").triggerHandler("checkout.confirm_payment_provider", [paymentProvider]);
            if (typeof _response !== "undefined") {
                if (_response === false) return false;
            }
            $("#bottom_payment_button").attr("disabled", "disabled");
            if (paymentProvider != "" && $(paymentProvider).hasClass("ProviderHasPaymentForm")) {
                var providerName = $(".ProviderName" + paymentProvider.val()).html();
                $("#CheckoutStepConfirmation .ExpressCheckoutCompletedContent").html(providerName);
                ExpressCheckout.LoadPaymentForm($(paymentProvider).val());
                return false;
            } else {
                ExpressCheckout.HidePaymentForm();
                return true;
            }
        },
        ApplyCouponCode: function () {
            if ($("#couponcode").val() === "") {
                alert(lang.EnterCouponCode);
                $("#couponcode").focus();
                return false;
            }
            $.ajax({ url: "remote.php", data: "w=getExpressCheckoutConfirmation&" + $("#CheckoutStepConfirmation form").serialize(), dataType: "json", type: "post", success: ExpressCheckout.HandleResponse });
            return false;
        },
        UncheckPaymentProvider: function () {
            $("#provider_list input").each(function () {
                $(this).attr("checked", false);
            });
        },
    };
    ExpressCheckout.signedIn = _signedIn;
    ExpressCheckout.digitalOrder = _digitalOrder;
    ExpressCheckout.currentStep = _currentStep;
    if (useAddressValidation) {
        ExpressCheckout.ChooseShippingAddress = _chooseShipping;
        ExpressCheckout.ChooseBillingAddress = _chooseBilling;
    }
})(window.jQuery, MINIBC.Events.Checkout);
var promoCartPage = function (promo, _affirm_config, $, mbc) {
    var getCart = function () {
        return $.ajax({ url: "/api/storefront/carts", headers: { Accept: "application/json" }, dataType: "json" });
    };
    var getCheckoutByID = function () {
        return $.ajax({ url: "/api/storefront/checkouts/" + cart_id, headers: { Accept: "application/json" }, dataType: "json" });
    };
    var getProductInfo = function () {
        var progress = new $.Deferred();
        if (product_ids != undefined) {
            var data = { id: product_ids };
            mbc.request(data, "/apps/affirm/storefront/product", "get", "json")
                .done(function (resp) {
                    progress.resolve(resp);
                })
                .fail(function (resp) {
                    progress.reject();
                });
        } else {
            progress.reject();
        }
        return progress.promise();
    };
    var getProductIDs = function (checkout) {
        var result = [];
        var items = checkout.cart.lineItems;
        var keys = Object.keys(items);
        var itemsArray = keys.map(function (i) {
            return items[i];
        });
        if (itemsArray.length == 0) {
            return undefined;
        }
        itemsArray.forEach(function (itemList) {
            if (itemList.length > 0) {
                itemList.forEach(function (item) {
                    result.push(item.productId);
                });
            }
        });
        return result.join(",");
    };
    var getElementForPromoInjecting = function () {
        if (promo[page] && promo[page].theme == "default") {
            var el_by_default = document.getElementsByClassName("cart-totals");
            if (el_by_default.length > 0) {
                return el_by_default[0];
            } else {
                return undefined;
            }
        } else {
            if (promo[page].selector == "") {
                return undefined;
            } else {
                var el_by_id = document.getElementById(promo[page].selector);
                var el_by_class = document.getElementsByClassName(promo[page].selector);
                if (el_by_id != null) {
                    return el_by_id;
                } else if (el_by_class.length > 0) {
                    return el_by_class[0];
                } else {
                    return undefined;
                }
            }
        }
    };
    var buildPromoMessage = function (data) {
        var item = document.createElement("P");
        item.style.marginBottom = "0px";
        item.classList.add("affirm-as-low-as");
        item.setAttribute("data-page-type", "cart");
        item.setAttribute("data-amount", amount);
        if (data.logo_color != "default") {
            item.setAttribute("data-affirm-color", data.logo_color);
        }
        if (data.logo_type != "default") {
            item.setAttribute("data-affirm-type", data.logo_type);
        }
        if (data.promo_id != "") {
            item.setAttribute("data-promo-id", data.promo_id);
        }
        if (categoty_list != "") {
            item.setAttribute("data-category", categoty_list);
        }
        if (sku_list != "") {
            item.setAttribute("data-sku", sku_list);
        }
        if (brand_list != "") {
            item.setAttribute("data-brand", brand_list);
        }
        return item;
    };
    var setStyle = function (element, data) {
        element.style.display = "inline-block";
        element.style.height = data.container_style.height;
        element.style.width = data.container_style.width;
        element.style.textAlign = "right";
        return element;
    };
    var getProductInfoData = function (data) {
        var result = "";
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            if (data[keys[i]] !== "false") {
                result += data[keys[i]] + ",";
            }
        }
        return result.substring(0, result.length - 1);
    };
    var displayPromo = function () {
        if (injecting_element != undefined) {
            var min = 5e3;
            if (promo[page].minimum != "") {
                var merchant_min_value = parseInt(parseFloat(promo[page].minimum) * 100);
                if (merchant_min_value > min) {
                    min = merchant_min_value;
                }
            }
            if (amount > min) {
                var data = promo[page];
                div.id = "afffirm-promo-box";
                div.appendChild(buildPromoMessage(data));
                div = setStyle(div, data);
                injecting_element.appendChild(div);
                watchForChangeOnCartPage();
                (function (l, g, m, e, a, f, b) {
                    var d,
                        c = l[m] || {},
                        h = document.createElement(f),
                        n = document.getElementsByTagName(f)[0],
                        k = function (a, b, c) {
                            return function () {
                                a[b]._.push([c, arguments]);
                            };
                        };
                    c[e] = k(c, e, "set");
                    d = c[e];
                    c[a] = {};
                    c[a]._ = [];
                    d._ = [];
                    c[a][b] = k(c, a, b);
                    a = 0;
                    for (b = "set add save post open empty reset on off trigger ready setProduct".split(" "); a < b.length; a++) d[b[a]] = k(c, e, b[a]);
                    a = 0;
                    for (b = ["get", "token", "url", "items"]; a < b.length; a++) d[b[a]] = function () { };
                    h.async = !0;
                    h.src = g[f];
                    n.parentNode.insertBefore(h, n);
                    delete g[f];
                    d(g);
                    l[m] = c;
                })(window, _affirm_config, "affirm", "checkout", "ui", "script", "ready");
            }
        }
    };
    var watchForChangeOnCartPage = function () {
        var time;
        var check = function () {
            var el = document.getElementById("afffirm-promo-box");
            if (el == undefined) {
                getCheckoutByID()
                    .done(function (checkout) {
                        var new_amount = parseInt(parseFloat(checkout.grandTotal) * 100);
                        var element = getElementForPromoInjecting();
                        element.appendChild(div);
                        document.getElementById("afffirm-promo-box").childNodes[0].setAttribute("data-amount", new_amount);
                        affirm.ui.refresh();
                    })
                    .fail(function (err) {
                        console.error(err);
                    });
            }
        };
        time = setInterval(check, 1e3);
    };
    var page = "cart";
    var product_ids = "";
    var injecting_element = getElementForPromoInjecting();
    var cart_id = "";
    var div = document.createElement("DIV");
    var categoty_list;
    var sku_list;
    var brand_list;
    var amount;
    if (promo[page].status) {
        getCart()
            .done(function (cart) {
                if (cart[0] && cart[0].id) cart_id = cart[0].id;
                getCheckoutByID()
                    .done(function (checkout) {
                        product_ids = getProductIDs(checkout);
                        amount = parseInt(parseFloat(checkout.grandTotal) * 100);
                        getProductInfo()
                            .done(function (product_info) {
                                categoty_list = getProductInfoData(product_info.data["categories"]);
                                sku_list = getProductInfoData(product_info.data["skus"]);
                                brand_list = getProductInfoData(product_info.data["brands"]);
                                displayPromo();
                            })
                            .fail(function (result) { });
                    })
                    .fail(function (err) {
                        console.error(err);
                    });
            })
            .fail(function () {
                console.error(err);
            });
    }
};
var promoProductPage = function (promo, _affirm_config, $, mbc) {
    var getProductID = function () {
        var el = document.getElementsByName("product_id");
        if (el.length > 0) {
            return el[0].value;
        } else {
            return undefined;
        }
    };
    var getElementForPromoInjecting = function (class_name) {
        var el_by_default = document.getElementsByClassName(class_name);
        if (el_by_default.length > 0) {
            return el_by_default[0];
        } else {
            el_by_default = document.getElementById(class_name);
            return el_by_default;
        }
    };
    var watchForChangeOnProductPage = function () {
        $(document).ajaxComplete(function (event, xhr, settings) {
            var response = JSON.parse(xhr.responseText);
            if (settings.data != undefined) {
                if (settings.data.indexOf("getProductAttributeDetails") > -1) {
                    var price = parseInt(parseFloat(response.details.unformattedPrice) * 100);
                    if (promo[page].inline_pricing) {
                        price = getInlinePrice();
                    }
                    var el = document.getElementById("afffirm-promo-box");
                    if (el != undefined) {
                        el.childNodes[0].setAttribute("data-amount", price);
                        affirm.ui.refresh();
                    }
                }
                if (settings.data.indexOf("getProductAttributeDetails") > -1) {
                    var price = parseInt(parseFloat(response.details.unformattedPrice) * 100);
                    if (promo[page].inline_pricing) {
                        price = getInlinePrice();
                    }
                    var el = document.getElementById("afffirm-promo-box");
                    if (el != undefined) {
                        el.childNodes[0].setAttribute("data-amount", price);
                        affirm.ui.refresh();
                    }
                }
            }
            if (_affirm_config.option_selector != undefined) {
                $("." + _affirm_config.option_selector).on("change", function () {
                    setTimeout(function () {
                        var price_raw = $("." + _affirm_config.price_selector).html();
                        var price = parseInt(parseFloat(Number(price_raw.replace(/[^0-9.-]+/g, ""))) * 100);
                        if (promo[page].inline_pricing) {
                            price = getInlinePrice();
                        }
                        var el = document.getElementById("afffirm-promo-box");
                        if (el != undefined) {
                            el.childNodes[0].setAttribute("data-amount", price);
                            affirm.ui.refresh();
                        }
                    }, 1200);
                });
            }
        });
    };
    var buildPromoMessage = function (data) {
        var item = document.createElement("P");
        item.style.marginBottom = "0px";
        item.classList.add("affirm-as-low-as");
        item.setAttribute("data-page-type", "product");
        item.setAttribute("data-amount", amount);
        if (data.logo_color != "default") {
            item.setAttribute("data-affirm-color", data.logo_color);
        }
        if (data.logo_type != "default") {
            item.setAttribute("data-affirm-type", data.logo_type);
        }
        if (data.promo_id != "") {
            item.setAttribute("data-promo-id", data.promo_id);
        }
        if (categoty_list != "") {
            item.setAttribute("data-category", categoty_list);
        }
        if (sku_list != "") {
            item.setAttribute("data-sku", sku_list);
        }
        if (brand_list != "") {
            item.setAttribute("data-brand", brand_list);
        }
        return item;
    };
    var setStyle = function (element, data) {
        element.style.display = "inline-block";
        element.style.height = data.container_style.height;
        element.style.width = data.container_style.width;
        element.style.textAlign = "left";
        return element;
    };
    var getProductInfo = function () {
        var progress = new $.Deferred();
        if (product_id != undefined) {
            var data = { id: product_id };
            mbc.request(data, "/apps/affirm/storefront/product", "get", "json")
                .then(function (resp) {
                    progress.resolve(resp);
                })
                .fail(function (resp) {
                    progress.reject();
                });
        } else {
            progress.reject();
        }
        return progress.promise();
    };
    var getProductInfoData = function (data) {
        var result = "";
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            if (data[keys[i]] !== "false") {
                result += data[keys[i]] + ",";
            }
        }
        return result.substring(0, result.length - 1);
    };
    var displayPromo = function () {
        if (injecting_element != undefined) {
            var min = 0;
            if (promo[page].minimum != "") {
                var merchant_min_value = parseInt(parseFloat(promo[page].minimum) * 100);
                if (merchant_min_value > min) {
                    min = merchant_min_value;
                }
            }
            if (amount > min) {
                var data = promo[page];
                var div = document.createElement("DIV");
                div.id = "afffirm-promo-box";
                div.appendChild(buildPromoMessage(data));
                div = setStyle(div, data);
                injecting_element.appendChild(div);
                watchForChangeOnProductPage();
                if (promo[page].inline_pricing) productOptionChange();
                (function (l, g, m, e, a, f, b) {
                    var d,
                        c = l[m] || {},
                        h = document.createElement(f),
                        n = document.getElementsByTagName(f)[0],
                        k = function (a, b, c) {
                            return function () {
                                a[b]._.push([c, arguments]);
                            };
                        };
                    c[e] = k(c, e, "set");
                    d = c[e];
                    c[a] = {};
                    c[a]._ = [];
                    d._ = [];
                    c[a][b] = k(c, a, b);
                    a = 0;
                    for (b = "set add save post open empty reset on off trigger ready setProduct".split(" "); a < b.length; a++) d[b[a]] = k(c, e, b[a]);
                    a = 0;
                    for (b = ["get", "token", "url", "items"]; a < b.length; a++) d[b[a]] = function () { };
                    h.async = !0;
                    h.src = g[f];
                    n.parentNode.insertBefore(h, n);
                    delete g[f];
                    d(g);
                    l[m] = c;
                })(window, _affirm_config, "affirm", "checkout", "ui", "script", "ready");
            }
        }
    };
    var productOptionChange = function () {
        $("body").on("click", function (e) {
            setTimeout(function () {
                var new_price = getInlinePrice();
                var el = document.getElementById("afffirm-promo-box");
                if (new_price != amount) {
                    amount = new_price;
                    el.childNodes[0].setAttribute("data-amount", new_price);
                    affirm.ui.refresh();
                }
            }, 1e3);
        });
    };
    var displayPromoQuick = function (quick_injecting_element) {
        if (quick_injecting_element != undefined) {
            var min = 0;
            if (promo[page].minimum != "") {
                var merchant_min_value = parseInt(parseFloat(promo[page].minimum) * 100);
                if (merchant_min_value > min) {
                    min = merchant_min_value;
                }
            }
            var priceSelector = ".previewCartCheckout-price";
            console.log("priceSelector", priceSelector);
            var price = $(priceSelector).html().trim();
            var formatted_price = Number(price.replace(/[^0-9.-]+/g, ""));
            formatted_price = Math.abs(parseFloat(formatted_price) * 100);
            if (formatted_price > min) {
                if ("selector" in promo.quick_cart && promo.quick_cart.selector != "") {
                    var class_name = promo.quick_cart.selector;
                    var el_by_default = document.getElementsByClassName(class_name);
                    console.log("el_by_default", el_by_default, class_name);
                    if (el_by_default.length > 0) {
                        quick_injecting_element = el_by_default[0];
                    } else if (el_by_default.length === 0) {
                        quick_injecting_element = document.getElementById(class_name);
                    }
                }
                var promo_config = {
                    field: "ala",
                    amount: formatted_price,
                    logo_color: promo.quick_cart.logo_color == "default" ? "blue" : promo.quick_cart.logo_color,
                    logo_type: promo.quick_cart.logo_type == "default" ? "logo" : promo.quick_cart.logo_type,
                    page_type: "product",
                    show_cta: true,
                };
                $.ajax({ url: (_affirm_config.api_endpoint ? _affirm_config.api_endpoint : "https://www.affirm.com/api/") + "promos/v2/" + _affirm_config.public_api_key + "?" + serialize(promo_config), type: "GET" })
                    .done(function (res) {
                        var data = promo.quick_cart;
                        var div = document.createElement("DIV");
                        div.id = "afffirm-promo-box-quick";
                        var item = buildPromoMessage(data);
                        item.innerHTML = res.promo.html_ala;
                        item.style.marginTop = "1rem";
                        div.appendChild(item);
                        div = setStyle(div, data);
                        quick_injecting_element.appendChild(div);
                        setTimeout(function () {
                            var el = document.getElementById("afffirm-promo-box-quick");
                            if (el) {
                                el.childNodes[0].setAttribute("data-amount", formatted_price);
                                affirm.ui.refresh();
                            }
                        }, 500);
                    })
                    .fail(function (err) {
                        console.log("err", err);
                    });
            }
        }
    };
    var getInlinePrice = function () {
        var target = ".price-section--withoutTax .price--withoutTax";
        if (promo[page].inline_pricing_target && promo[page].inline_pricing_target != "") target = promo[page].inline_pricing_target;
        var price = $(target).html();
        if (price.indexOf("-") > -1) {
            price = price.split("-");
            price = parseFloat(price[0].replace(/[^0-9\.]/g, ""));
        } else {
            price = parseFloat(price.replace(/[^0-9\.]/g, ""));
        }
        return price * 100;
    };
    var serialize = function (obj) {
        var str = [];
        for (var p in obj)
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    };
    var page = "product";
    var product_id = getProductID();
    var injecting_element = getElementForPromoInjecting("productView-product");
    if (!injecting_element) {
        injecting_element = getElementForPromoInjecting("productView-details");
    }
    if (promo[page].selector && promo[page].selector != "") {
        injecting_element = getElementForPromoInjecting(promo[page].selector);
    }
    var categoty_list;
    var sku_list;
    var brand_list;
    var amount;
    if (promo[page].status) {
        getProductInfo()
            .then(function (product_info) {
                categoty_list = getProductInfoData(product_info.data["categories"]);
                sku_list = getProductInfoData(product_info.data["skus"]);
                brand_list = getProductInfoData(product_info.data["brands"]);
                amount = product_info.data["amount"];
                if (promo[page].inline_pricing) {
                    amount = getInlinePrice();
                }
                displayPromo();
                $("#form-action-addToCart").on("click", function () {
                    setTimeout(function () {
                        var quick_injecting_element = getElementForPromoInjecting("previewCartCheckout");
                        displayPromoQuick(quick_injecting_element);
                    }, 2e3);
                });
                $(".modal-close").on("click", function () {
                    var el = document.getElementById("afffirm-promo-box");
                    if (el != undefined) {
                        el.childNodes[0].setAttribute("data-amount", amount);
                        affirm.ui.refresh();
                    }
                });
            })
            .fail(function (result) { });
    }
};
var promoCategoryPage = function (promo, _affirm_config, $, mbc) {
    var getProductInfo = function (product_id) {
        var progress = new $.Deferred();
        if (product_id != undefined) {
            var data = { id: product_id };
            mbc.request(data, "/apps/affirm/storefront/product", "get", "json")
                .then(function (resp) {
                    progress.resolve(resp);
                })
                .fail(function (resp) {
                    progress.reject();
                });
        } else {
            progress.reject();
        }
        return progress.promise();
    };
    var getProductInfoData = function (data) {
        var result = "";
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            if (data[keys[i]] !== "false") {
                result += data[keys[i]] + ",";
            }
        }
        return result.substring(0, result.length - 1);
    };
    var getProductInfoData = function (data) {
        var result = "";
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            if (data[keys[i]] !== "false") {
                result += data[keys[i]] + ",";
            }
        }
        return result.substring(0, result.length - 1);
    };
    var buildPromoMessage = function (data, amount, categoty_list, sku_list, brand_list) {
        var item = document.createElement("P");
        item.style.marginBottom = "0px";
        item.classList.add("affirm-as-low-as");
        item.setAttribute("data-page-type", "category");
        item.setAttribute("data-amount", amount);
        if (data.logo_color != "default") {
            item.setAttribute("data-affirm-color", data.logo_color);
        }
        if (data.logo_type != "default") {
            item.setAttribute("data-affirm-type", data.logo_type);
        }
        if (data.promo_id != "") {
            item.setAttribute("data-promo-id", data.promo_id);
        }
        if (categoty_list != "") {
            item.setAttribute("data-category", categoty_list);
        }
        if (sku_list != "") {
            item.setAttribute("data-sku", sku_list);
        }
        if (brand_list != "") {
            item.setAttribute("data-brand", brand_list);
        }
        return item;
    };
    var setStyle = function (element, data) {
        element.style.display = "inline-block";
        element.style.height = data.container_style.height;
        element.style.width = data.container_style.width;
        element.style.textAlign = "right";
        return element;
    };
    var displayPromo = function () {
        var min = 0;
        if (promo[page].minimum != "") {
            var merchant_min_value = parseInt(parseFloat(promo[page].minimum));
            if (merchant_min_value > min) {
                min = merchant_min_value;
            }
        }
        var target_products = promo[page].selector && promo[page].selector != "" ? promo[page].selector : "#product-listing-container .product";
        var products_length = $(target_products).length;
        var count = 0;
        var total = 0;
        $(target_products).each(function (key, item) {
            var html_price = $(".price--withoutTax", item).html();
            if (!html_price || html_price.length === 0) return true;
            var price = $(".price--withoutTax", item)
                .html()
                .replace(/[^0-9\.\-]/g, "");
            if (promo[page].inline_pricing && price.indexOf("-") > -1) {
                price = price.split("-");
                price = price[0].replace(/[^0-9\.]/g, "");
            }
            var id = $("img", item)
                .attr("src")
                .replace(/https:\/\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)(.*)/, "$7");
            if (id === "img") {
                id = $("img", item)
                    .attr("data-src")
                    .replace(/https:\/\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)(.*)/, "$7");
            }
            total++;
            getProductInfo(id).done(function (product_info) {
                if (price && parseFloat(price) > min) {
                    var categoty_list = getProductInfoData(product_info.data["categories"]);
                    var sku_list = getProductInfoData(product_info.data["skus"]);
                    var brand_list = getProductInfoData(product_info.data["brands"]);
                    var data = promo[page];
                    var div = document.createElement("DIV");
                    div.id = "afffirm-promo-box-" + id;
                    div.appendChild(buildPromoMessage(data, Math.round(price * 100), categoty_list, sku_list, brand_list));
                    div = setStyle(div, data);
                    var target_body = promo[page].selector_container && promo[page].selector_container != "" ? "." + promo[page].selector_container : ".card-body";
                    $(target_body, item).append(div);
                    $.ajax({
                        url: affirm.config.frontend_url + "/api/promos/v2/" + _affirm_config.public_api_key,
                        method: "GET",
                        data: {
                            field: "ala",
                            amount: Math.round(price * 100),
                            logo_color: promo[page].logo_color === "default" ? "blue" : promo[page].logo_color,
                            logo_type: promo[page].logo_type === "default" ? "logo" : promo[page].logo_type,
                            page_type: "product",
                            show_cta: true,
                        },
                        success: function (affirm_data) {
                            var html = affirm_data.promo.html_ala;
                            $("#afffirm-promo-box-" + id + " .affirm-as-low-as").html(html);
                            $("#afffirm-promo-box-" + id + " .affirm-as-low-as").css({ "text-align": "left" });
                            $("#afffirm-promo-box-" + id + " .affirm-as-low-as a").remove();
                            count++;
                            if (count === products_length || count === total) affirm.ui.refresh();
                        },
                        error: function (affirm_error) {
                            count++;
                            if (count === products_length || count === total) affirm.ui.refresh();
                        },
                    });
                } else {
                    count++;
                    if (count === products_length || count === total) affirm.ui.refresh();
                }
            });
        });
    };
    var page = "category";
    if (promo[page].status) {
        (function (l, g, m, e, a, f, b) {
            var d,
                c = l[m] || {},
                h = document.createElement(f),
                n = document.getElementsByTagName(f)[0],
                k = function (a, b, c) {
                    return function () {
                        a[b]._.push([c, arguments]);
                    };
                };
            c[e] = k(c, e, "set");
            d = c[e];
            c[a] = {};
            c[a]._ = [];
            d._ = [];
            c[a][b] = k(c, a, b);
            a = 0;
            for (b = "set add save post open empty reset on off trigger ready setProduct".split(" "); a < b.length; a++) d[b[a]] = k(c, e, b[a]);
            a = 0;
            for (b = ["get", "token", "url", "items"]; a < b.length; a++) d[b[a]] = function () { };
            h.async = !0;
            h.src = g[f];
            n.parentNode.insertBefore(h, n);
            delete g[f];
            d(g);
            l[m] = c;
        })(window, _affirm_config, "affirm", "checkout", "ui", "script", "ready");
        displayPromo();
    }
};
(function ($, mbc) {
    var metaData = { platform_type: "BigCommerce", platform_version: "BeAPartOf - 1.0", platform_affirm: "1.0" };
    var store_data = {};
    function defer() {
        if (window.jQuery) {
            var Checkout = function () {
                var checkoutStatus = "pending";
                var checkoutId = "";
                var paymentSubmitted = false;
                var selectors = { placeOrderBtn: "#checkout-payment-continue" };
                var getCart = function () {
                    var progress = new $.Deferred();
                    $.ajax({ url: "/api/storefront/carts", headers: { Accept: "application/json" }, dataType: "json" })
                        .done(function (resp) {
                            var cart = resp.shift();
                            progress.resolve(cart);
                        })
                        .fail(function () {
                            progress.reject();
                        });
                    return progress.promise();
                };
                var getStoreCredit = function (customerId) {
                    var progress = new $.Deferred();
                    if (customerId <= 0) {
                        progress.resolve(0);
                    } else {
                        mbc.request({}, "/apps/affirm/customers/" + customerId + "/credit", "get", "json")
                            .done(function (resp) {
                                progress.resolve(resp.store_credit);
                            })
                            .fail(function () {
                                progress.resolve(0);
                            });
                    }
                    return progress.promise();
                };
                var getDiscounts = function (cart) {
                    var discounts = {};
                    (function (data) {
                        data.forEach(function (item, index) {
                            discounts[item.code] = { discount_amount: item.used, discount_display_name: "Gift Certificate #" + item.code };
                        });
                    })(cart.giftCertificates);
                    (function (data) {
                        data.forEach(function (item, index) {
                            discounts[item.code] = { discount_amount: item.discountedAmount, discount_display_name: item.displayName };
                        });
                    })(cart.coupons);
                    return discounts;
                };
                var getBillingInformation = function (cart) {
                    var billing = cart.billingAddress;
                    return {
                        name: { first: billing.firstName, last: billing.lastName },
                        address: { line1: billing.address1, line2: billing.address2, city: billing.city, state: billing.stateOrProvinceCode, zipcode: billing.postalCode, country: billing.countryCode },
                        phone_number: billing.phone,
                        email: billing.email,
                    };
                };
                var getProductCategories = function (cart) {
                    var result = [];
                    var items = cart.cart.lineItems;
                    var keys = Object.keys(items);
                    var itemsArray = keys.map(function (i) {
                        return items[i];
                    });
                    var progress = new $.Deferred();
                    itemsArray.forEach(function (itemList) {
                        if (itemList.length > 0) {
                            itemList.forEach(function (item) {
                                result.push(item.productId);
                            });
                        }
                    });
                    var mbc_data = { id: result.join(",") };
                    mbc.request(mbc_data, "/apps/affirm/storefront/product", "get", "json")
                        .done(function (resp) {
                            progress.resolve(resp.data.categories);
                        })
                        .fail(function () {
                            progress.reject();
                        });
                    return progress.promise();
                };
                var getProductCategoriesResults = function (categories, id) {
                    return categories[id].split(",");
                };
                var bindEvents = function () {
                    $("html").on("click", selectors.placeOrderBtn, function (e) {
                        var id = $(".optimizedCheckout-form-checklist-checkbox:checked").attr("id");
                        if (paymentSubmitted || id !== "radio-cod") {
                            return true;
                        }
                        e.preventDefault();
                        if (checkoutStatus !== "ready") {
                            return false;
                        }
                        if (checkoutStatus === "error") {
                            return false;
                        }
                        disableFinishOrderButton();
                    });
                    var unhideAffirm = function () {
                        var paymentMethod = $('.form-checklist label[for="radio-cod"]');
                        if (paymentMethod.length !== 0) {
                            paymentMethod.css("display", "block");
                            shouldAffirmBeDisplayed();
                            clearInterval(unhideAffirmCheck);
                        }
                    };
                    var unhideAffirmCheck = setInterval(unhideAffirm, 1e3);
                };
                var disableFinishOrderButton = function () {
                    $(selectors.placeOrderBtn).attr("disabled", true);
                };
                var init = function () {
                    disableFinishOrderButton();
                    getCart()
                        .done(function (cart) {
                            checkoutId = cart.id;
                            checkoutStatus = "ready";
                            bindEvents();
                        })
                        .fail(function () {
                            checkoutStatus = "error";
                        });
                };
                return { init: init };
            };
            var shouldAffirmBeDisplayed = function () {
                if (store_data.hideAffirm) {
                    hideAffirm();
                } else {
                    $.ajax({ url: "/api/storefront/carts", headers: { Accept: "application/json" }, dataType: "json" })
                        .success(function (cart) {
                            var cartAmount = parseFloat(cart[0].cartAmount);
                            var min = parseFloat(store_data.min_order);
                            var max = parseFloat(store_data.max_order);
                            if (cartAmount > min && cartAmount < max) {
                                showAffirm();
                            } else {
                                hideAffirm();
                            }
                        })
                        .fail(function (result) {
                            hideAffirm();
                        });
                }
            };
            var showAffirm = function () {
                setInterval(function () {
                    var data = Array.prototype.slice.call(document.getElementsByClassName("paymentProviderHeader-name"));
                    if (data.length > 0) {
                        $('.form-checklist label[for="radio-cod"]').css("display", "block");
                        data.forEach(function (item) {
                            if (item.innerHTML.includes("Affirm") || item.innerHTML.includes("Monthly Payments")) {
                                item.innerHTML =
                                    "<p style='height:25px;margin:0px;display:flex;align-items:flex-end'><img src='https://cdn-assets.affirm.com/images/blue_logo-transparent_bg.png' style='height:25px;'> <span style='height:15px;margin-left:5px;';>Monthly Payments</span></p>";
                                item.id = "affirm-payment-option";
                                document.getElementById("radio-cod").addEventListener("click", function () {
                                    if (document.getElementById("radio-cod").checked) {
                                        showPaymentOption();
                                    }
                                });
                            }
                        });
                    }
                }, 500);
            };
            var hideAffirm = function () {
                setInterval(function () {
                    var data = Array.prototype.slice.call(document.getElementsByClassName("paymentProviderHeader-name"));
                    if (data.length > 0) {
                        data.forEach(function (item) {
                            if (item.innerHTML.includes("Affirm") || item.innerHTML.includes("Monthly")) {
                                var affirmOption = document.getElementById("affirm-payment-option");
                                if (affirmOption) {
                                    affirmOption.parentNode.outerHTML = "";
                                } else {
                                    item.parentNode.parentNode.parentNode.parentNode.outerHTML = "";
                                }
                            }
                        });
                    }
                }, 500);
            };
            var showPaymentOption = function () {
                if (document.getElementById("radio-cod").checked) {
                    var item = document.getElementById("affirm-payment-option");
                    var parent = item.parentElement.parentElement.parentElement.parentElement.parentElement;
                    parent.getElementsByClassName("form-checklist-body")[0].innerHTML =
                        "You will be redirected to Affirm to securely complete your purchase. Just fill out a few pieces of basic information and get a real-time decision. Checking your eligibility won't affect your credit score.";
                }
            };
            var showCustomLoading = function () {
                var check = function () {
                    if (document.getElementsByTagName("body")[0] != undefined) {
                        var el = document.getElementById("affirm-custom-loading");
                        if (el == undefined) {
                            var loading = document.createElement("DIV");
                            loading.id = "affirm-custom-loading";
                            loading.style.width = "100%";
                            loading.style.height = "100%";
                            loading.style.zIndex = "1000";
                            loading.style.backgroundColor = "rgb(245, 245, 245)";
                            loading.style.position = "fixed";
                            loading.style.top = "0px";
                            loading.style.left = "0px";
                            loading.style.display = "flex";
                            loading.style.alignItems = "flex-start";
                            loading.style.justifyContent = "center";
                            loading.style.opacity = "0.9";
                            var message = document.createElement("P");
                            message.style.fontFamily = "font-family: 'proxima-nova-regular', -apple-system,BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;";
                            message.style.fontSize = "15px";
                            message.style.color = "#FFFFFF";
                            message.style.backgroundColor = "black";
                            message.style.lingHeight = "1.7";
                            message.style.fontWeight = "400";
                            message.style.borderRadius = "10px";
                            message.style.padding = "8px 16px 8px 16px";
                            message.style.margin = "90px 0px 0px 0px";
                            var textnode = document.createTextNode("Loading");
                            message.appendChild(textnode);
                            loading.appendChild(message);
                            document.getElementsByTagName("body")[0].appendChild(loading);
                        } else {
                            document.getElementById("affirm-custom-loading").style.display = "flex";
                        }
                        clearInterval(time);
                    }
                };
                var time = setInterval(check, 1e3);
            };
            var hideCustomLoading = function () {
                document.getElementById("affirm-custom-loading").style.display = "none";
            };
            var redirect = function (message, path) {
                if (confirm(message)) {
                    window.location.replace(path);
                } else {
                    window.location.replace(path);
                }
            };
            var setStoreHash = function () {
                mbc.request({}, "/apps/affirm/storefront/config", "get", "json")
                    .done(function (data) {
                        store_data = data;
                        var _affirm_config = {
                            public_api_key: data.public_api_key,
                            script: data.endpoint,
                            price_selector: data.priceSelector ? data.priceSelector : "price--withoutTax",
                            option_selector: data.optionSelector ? data.optionSelector : "product-options",
                            api_endpoint: data.api_endpoint,
                            category_as_low_as: parseFloat(data.category_as_low_as),
                        };
                        if (window.location.pathname == "/checkout") {
                            (function (l, g, m, e, a, f, b) {
                                var d,
                                    c = l[m] || {},
                                    h = document.createElement(f),
                                    n = document.getElementsByTagName(f)[0],
                                    k = function (a, b, c) {
                                        return function () {
                                            a[b]._.push([c, arguments]);
                                        };
                                    };
                                c[e] = k(c, e, "set");
                                d = c[e];
                                c[a] = {};
                                c[a]._ = [];
                                d._ = [];
                                c[a][b] = k(c, a, b);
                                a = 0;
                                for (b = "set add save post open empty reset on off trigger ready setProduct".split(" "); a < b.length; a++) d[b[a]] = k(c, e, b[a]);
                                a = 0;
                                for (b = ["get", "token", "url", "items"]; a < b.length; a++) d[b[a]] = function () { };
                                h.async = !0;
                                h.src = g[f];
                                n.parentNode.insertBefore(h, n);
                                delete g[f];
                                d(g);
                                l[m] = c;
                            })(window, _affirm_config, "affirm", "checkout", "ui", "script", "ready");
                            $.ajax({ url: "/api/storefront/carts", headers: { Accept: "application/json" }, dataType: "json" })
                                .done(function (cart) {
                                    if (cart[0] && cart[0].id) {
                                        var cart_id = cart[0].id;
                                        localStorage.setItem("cart_id", cart_id);
                                    }
                                })
                                .fail(function (cart) {
                                    console.error(cart);
                                });
                        } else {
                            if (data.promotional != "") {
                                console.log("data", data.promotional, $("#product-listing-container").length > 0, $('[itemtype="http://schema.org/Product"]').length === 0);
                                window.affirm_setup = { promo: JSON.parse(data.promotional), config: _affirm_config, jQuery: $, mbc: mbc };
                                if (window.location.pathname.includes("/cart.php")) {
                                    promoCartPage(JSON.parse(data.promotional), _affirm_config, $, mbc);
                                } else if (window.location.pathname.includes("/order-confirmation")) {
                                    var cart_id = localStorage.getItem("cart_id");
                                    submitAffirmAnalytics(cart_id, mbc, _affirm_config);
                                } else if ($("#product-listing-container").length > 0 && $('[itemtype="http://schema.org/Product"]').length === 0) {
                                    promoCategoryPage(JSON.parse(data.promotional), _affirm_config, $, mbc);
                                } else {
                                    promoProductPage(JSON.parse(data.promotional), _affirm_config, $, mbc);
                                }
                            }
                        }
                    })
                    .fail(function (result) {
                        console.error("FAILED to get storefront config", result);
                    });
            };
            setStoreHash();
        } else {
            setTimeout(defer, 1e3);
        }
    }
    defer();
})(window.jQuery, MINIBC);
var submitAffirmAnalytics = function (cart_id, mbc, _affirm_config) {
    console.log("call start");
    mbc.request({}, "/apps/affirm/storefront/" + cart_id + "/analytic", "get", "json")
        .done(function (resp) {
            if (resp.order && resp.product) {
                var orderData = JSON.parse(resp.order);
                var productData = JSON.parse(resp.product);
                console.log("Date preview", orderData, productData);
                (function (l, g, m, e, a, f, b) {
                    var d,
                        c = l[m] || {},
                        h = document.createElement(f),
                        n = document.getElementsByTagName(f)[0],
                        k = function (a, b, c) {
                            return function () {
                                a[b]._.push([c, arguments]);
                            };
                        };
                    c[e] = k(c, e, "set");
                    d = c[e];
                    c[a] = {};
                    c[a]._ = [];
                    d._ = [];
                    c[a][b] = k(c, a, b);
                    a = 0;
                    for (b = "set add save post open empty reset on off trigger ready setProduct".split(" "); a < b.length; a++) d[b[a]] = k(c, e, b[a]);
                    a = 0;
                    for (b = ["get", "token", "url", "items"]; a < b.length; a++) d[b[a]] = function () { };
                    h.async = !0;
                    h.src = g[f];
                    n.parentNode.insertBefore(h, n);
                    delete g[f];
                    d(g);
                    l[m] = c;
                })(window, _affirm_config, "affirm", "checkout", "ui", "script", "ready");
                affirm.ui.ready(function () {
                    affirm.analytics.trackOrderConfirmed(orderData, productData);
                });
            }
        })
        .fail(function () {
            console.log("failed");
        });
};
