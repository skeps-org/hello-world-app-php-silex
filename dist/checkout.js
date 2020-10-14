var skepsFrameModal = document.createElement('div');
skepsFrameModal.style.position = 'fixed';
skepsFrameModal.style.top = '0px';
skepsFrameModal.style.bottom = '0px';
skepsFrameModal.style.left = '0px';
skepsFrameModal.style.right = '0px';
skepsFrameModal.style.background = 'rgba(33,33,33,0.6)';
skepsFrameModal.style.display = 'none';
skepsFrameModal.style.zIndex = '99999';
var skepsOfferIframe = document.createElement('iframe');
skepsOfferIframe.setAttribute('width','100%');
skepsOfferIframe.setAttribute('src', 'https://iframe.pos.skeps.com/');
skepsOfferIframe.style.position = 'absolute';
skepsOfferIframe.style.top = '50%';
skepsOfferIframe.style.left = '50%';
skepsOfferIframe.style.transform = 'translate(-50%, -50%)';
skepsOfferIframe.style.width = '500px';
skepsOfferIframe.style.height = '300px';
skepsOfferIframe.style.background = '#fff';
skepsOfferIframe.style.borderRadius = '8px';
window.onload = function() {
    bindPaymentOption();
    skepsFrameModal.appendChild(skepsOfferIframe);
    document.body.appendChild(skepsFrameModal);
    setTimeout(function() {
        executeCheckoutPage();
    }, 1000)
}
function bindPaymentOption () {
    var paymentMethods = document.querySelectorAll('[name="paymentProviderRadio"]');
    if(paymentMethods && paymentMethods.length) {
        var skepsBtn = document.createElement('button');
        skepsBtn.setAttribute('id','skepscheckoutbtn')
        skepsBtn.value = 'Place Order';
        skepsBtn.type = 'button';
        skepsBtn.innerHTML = 'Place Order'
        skepsBtn.addEventListener('click', initiateIframe);
        paymentMethods.forEach(function(method) {
            method.addEventListener('change', function(event) {
                if((event.target.value === 'instore') && event.target.checked) {
                    document.querySelector('#checkout-payment-continue').style.display = 'none';
                    if(document.querySelector('#skepscheckoutbtn')) {
                        document.querySelector('#skepscheckoutbtn').style.display = 'block';
                    } else {
                        skepsBtn.classList.add(...document.querySelector('#checkout-payment-continue').classList.value.split(' '))
                        document.querySelector('#checkout-payment-continue').parentElement.appendChild(skepsBtn)
                    }
                } else {
                    document.querySelector('#checkout-payment-continue').style.display = 'block';
                    document.querySelector('#skepscheckoutbtn') ? document.querySelector('#skepscheckoutbtn').style.display = 'none' : '';
                }
            })
        })
    } else {
        setTimeout(function() {
            bindPaymentOption()
        }, 2000)
    }
}

function initiateIframe() {
    skepsFrameModal.style.display = 'block';
    setTimeout(function() {
        processPayment();
    }, 5000)
}

function processPayment() {
    const url = '/internalapi/v1/checkout/order'
    fetch(url, {
        method: "POST",
        credentials: "same-origin"
    })
    .then(response => {
        const url = 'https://94ed26cf5897.ngrok.io/bigcommerce/webhooks';
        response.json().then((res) => {
            fetch(url, {
                method: "POST",
                body: JSON.stringify({
                    data:{
                        id: res.data.order.orderId
                    }
                })
            }).then(webhookResponse => {
                window.location.href = '/checkout/order-confirmation';
            })
        })
        // console.log(response.json())
    });
}
function ajaxhandler(url) {
    return fetch(url, {
        method: "GET",
        credentials: "same-origin"
    })
    .then(response => response.json());
 };
 function executeCheckoutPage() {
    var paymentFactor = 0.0274;
    var priceContainer = document.querySelector('[data-test="cart-total"]');
    var priceHtml = priceContainer.querySelector('.cart-priceItem-value > [data-test="cart-price-value"]').innerHTML;
    var price = Number(priceHtml.replace(/[^0-9.-]+/g,""));
    var offerDiv = document.createElement('div');
    offerDiv.style.fontSize = '14px';

    var emiPrice = (price*paymentFactor).toFixed(2);
    var intl = Intl.NumberFormat('en-US', {style: 'currency', currency:'USD'});
    offerDiv.innerHTML = 'Pay as low as ' + intl.format(emiPrice) + '/month with Skeps';
    priceContainer.appendChild(offerDiv);
}