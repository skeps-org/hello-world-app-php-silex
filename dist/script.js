window.onload = function() {
    var customerJWT = sessionStorage.getItem('customerJWT');
    if(!customerJWT) {
        getCustomerJWT();
    }
    setTimeout(function() {
        if(document.querySelector('[itemtype="http://schema.org/Product"]')) {
            executeProductPage();
        } else if(document.querySelector('#product-listing-container')) {
            executeCategoryPage();
        } else if(document.querySelector('main[data-cart]')) {
            executeCartPage();
        }
    }, 1000)
}
function getCustomerJWT() {
    var appClientId = "q886ngq3j61mz8e5ucnvq4sofhc7mja"; // TODO: Fill this in with your app's client ID
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
           if (xmlhttp.status == 200) {
               sessionStorage.setItem('customerJWT', xmlhttp.responseText)
            //    alert('Customer JWT:\n' + xmlhttp.responseText);
           }
           else if (xmlhttp.status == 404) {
            //   alert('Not logged in!');
           }
           else {
            //    alert('Something went wrong');
           }
        }
    };
    xmlhttp.open("GET", "/customer/current.jwt?app_client_id="+appClientId, true);
    xmlhttp.send();
}

function executeProductPage() {
    var paymentFactor = 0.0274;
    if(sessionStorage.getItem('customerJWT')){
        paymentFactor = 0.0233;
    }
    var priceContainer = document.querySelector('.productView-price');
    var price = priceContainer.querySelector('[itemprop="priceSpecification"]').querySelector('[itemprop="price"]').getAttribute('content');
    var offerDiv = document.createElement('div');
    offerDiv.style.fontSize = '80%';
    var emiPrice = (price*paymentFactor).toFixed(2);
    var intl = Intl.NumberFormat('en-US', {style: 'currency', currency:'USD'});
    offerDiv.innerHTML = 'Pay as low as ' + intl.format(emiPrice) + '/month with Skeps';
    priceContainer.appendChild(offerDiv)
}

function executeCategoryPage() {
    var paymentFactor = 0.0274;
    if(sessionStorage.getItem('customerJWT')){
        paymentFactor = 0.0233;
    }
    var productContainer = document.querySelector('.productGrid');
    var allProducts = productContainer.querySelectorAll('.product');
    allProducts.forEach(function(productItem) {
        var injectTarget = productItem.querySelector('[data-product-price-with-tax]').parentElement;
        var priceHtml = productItem.querySelector('[data-product-price-with-tax]').innerHTML;
        var price = Number(priceHtml.replace(/[^0-9.-]+/g,""));
        var offerDiv = document.createElement('div');
        offerDiv.style.fontSize = '80%';
        var emiPrice = (price*paymentFactor).toFixed(2);
        var intl = Intl.NumberFormat('en-US', {style: 'currency', currency:'USD'});
        offerDiv.innerHTML = 'Pay as low as ' + intl.format(emiPrice) + '/month with Skeps';
        injectTarget.appendChild(offerDiv)
    })
}

function executeCartPage() {
    var paymentFactor = 0.0274;
    if(sessionStorage.getItem('customerJWT')){
        paymentFactor = 0.0233;
    }
    var priceContainer = document.querySelector('[data-cart-totals]');
    var injectTarget = priceContainer.querySelector('.cart-total-value.cart-total-grandTotal');
    var priceHtml = priceContainer.querySelector('.cart-total-value.cart-total-grandTotal > span').innerHTML;
    var price = Number(priceHtml.replace(/[^0-9.-]+/g,""));
    var offerDiv = document.createElement('div');
    offerDiv.style.fontSize = '80%';
    offerDiv.style.whiteSpace = 'nowrap';
    offerDiv.style.direction = 'rtl';

    var emiPrice = (price*paymentFactor).toFixed(2);
    var intl = Intl.NumberFormat('en-US', {style: 'currency', currency:'USD'});
    offerDiv.innerHTML = 'Pay as low as ' + intl.format(emiPrice) + '/month with Skeps';
    injectTarget.appendChild(offerDiv);
}