<?php

require_once __DIR__ . '/vendor/autoload.php';

use Bigcommerce\Api\Client as Bigcommerce;
use Firebase\JWT\JWT;
use Guzzle\Http\Client;
use Silex\Application;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;


// Load from .env file
$dotenv = new Dotenv\Dotenv(__DIR__);
$dotenv->load();

$app = new Application();
$app['debug'] = true;

$app->get('/load', function (Request $request) use ($app) {

	$data = verifySignedRequest($request->get('signed_payload'));
	if (empty($data)) {
		return 'Invalid signed_payload.';
	}
	$redis = new Credis_Client('localhost');
	$key = getUserKey($data['store_hash'], $data['user']['email']);
	$user = json_decode($redis->get($key), true);
	if (empty($user)) {
		$user = $data['user'];
		$redis->set($key, json_encode($user, true));
	}
	return file_get_contents(__DIR__ . '/dist/index.html');
});

$app->get('/auth', function (Request $request) use ($app) {
	$redis = new Credis_Client('127.0.0.1');

	$payload = array(
		'client_id' => clientId(),
		'client_secret' => clientSecret(),
		'redirect_uri' => callbackUrl(),
		'grant_type' => 'authorization_code',
		'code' => $request->get('code'),
		'scope' => $request->get('scope'),
		'context' => $request->get('context'),
	);

	$client = new Client(bcAuthService());
	$req = $client->post('/oauth2/token', array(), $payload, array(
		'exceptions' => false,
	));
	$resp = $req->send();

	if ($resp->getStatusCode() == 200) {
		$data = $resp->json();
		list($context, $storeHash) = explode('/', $data['context'], 2);
		$key = getUserKey($storeHash, $data['user']['email']);

		// Store the user data and auth data in our key-value store so we can fetch it later and make requests.
		$redis->set($key, json_encode($data['user'], true));
		$redis->set("stores/{$storeHash}/auth", json_encode($data));
		// try {
		// 	$result = createWebhook($storeHash, clientId(), $data['access_token']);
		// 	// var_dump($result);
		// } catch (\Throwable $th) {
		// 	// var_dump($th);
		// }
		return 'Hello ' . json_encode($data);
	} else {
		return 'Something went wrong... [' . $resp->getStatusCode() . '] ' . $resp->getBody();
	}
});

$app->post('/webhooks', function (Request $request) use ($app) {
	$data = json_decode($request->getContent(), true);
	$storeHash = 'oswqulg515';
	$authToken = getAuthToken($storeHash);
	$clientId = clientId();
	$orderId = $data['data']['id'];
/* 	$curl = curl_init();
	curl_setopt_array($curl, array(
		CURLOPT_URL => "https://api.bigcommerce.com/stores/${storeHash}/v3/payments/access_tokens",
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_ENCODING => "",
		CURLOPT_MAXREDIRS => 10,
		CURLOPT_TIMEOUT => 30,
		CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		CURLOPT_CUSTOMREQUEST => "POST",
		CURLOPT_POSTFIELDS => "{\"order\":{\"id\":" . $orderId . "}}",
		CURLOPT_HTTPHEADER => array(
			"accept: application/json",
			"content-type: application/json",
			"x-auth-client: ${clientId}",
			"x-auth-token: ${authToken}"
		),
	));
	curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

	$response = curl_exec($curl);
	$err = curl_error($curl);

	curl_close($curl);

	if ($err) {
		echo "cURL Error #:" . $err;
		return 'not ok';
	} else {
		$res = json_decode($response, true);
		$pat = $res['data']['id'];
		$curl1 = curl_init();

		curl_setopt_array($curl1, array(
			CURLOPT_URL => "https://payments.bigcommerce.com/stores/${storeHash}/payments",
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_ENCODING => "",
			CURLOPT_MAXREDIRS => 10,
			CURLOPT_TIMEOUT => 30,
			CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			CURLOPT_CUSTOMREQUEST => "POST",
			CURLOPT_POSTFIELDS => "{\"payment\":{\"instrument\":{\"type\":\"card\",\"number\":\"3566002020360505\",\"cardholder_name\":\"John Doe\",\"expiry_month\":12,\"expiry_year\":2022,\"verification_value\":\"888\"},\"payment_method_id\":\"stripe.card\",\"save_instrument\":false}}",
			CURLOPT_HTTPHEADER => array(
				"accept: application/vnd.bc.v1+json",
				"authorization: PAT ${pat}",
				"content-type: application/json",
				"x-auth-client: ${clientId}",
				"x-auth-token: ${authToken}"
			),
		));
		curl_setopt($curl1, CURLOPT_SSL_VERIFYHOST, 0);
		curl_setopt($curl1, CURLOPT_SSL_VERIFYPEER, 0);
		try {
			$response1 = curl_exec($curl1);
		} catch (\Throwable $th) {
			echo $th;
		}
		$err1 = curl_error($curl1);

		curl_close($curl1);

		if ($err1) {
			echo "cURL Error #:" . $err1;
			return 'not ok';
		} else {
			$res = json_decode($response1, true);
 */			$curl = curl_init();

			curl_setopt_array($curl, array(
				CURLOPT_URL => "https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}",
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_ENCODING => "",
				CURLOPT_MAXREDIRS => 10,
				CURLOPT_TIMEOUT => 30,
				CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
				CURLOPT_CUSTOMREQUEST => "PUT",
				CURLOPT_POSTFIELDS => "{\"status_id\":11, \"payment_method\":\"Skeps Financing\"}",
				CURLOPT_HTTPHEADER => array(
					"accept: application/json",
					"content-type: application/json",
					"x-auth-client: ${clientId}",
					"x-auth-token: ${authToken}"
				),
			));
			curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
			curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
	
			$response = curl_exec($curl);
			$err = curl_error($curl);

			curl_close($curl);

			if ($err) {
				echo "cURL Error #:" . $err;
			} else {
				$headers = ['Access-Control-Allow-Origin' => '*'];
				$response = new Response(json_encode($response), 200, $headers);
				return $response;
			}
	// 	}
	// }
});



// Endpoint for removing users in a multi-user setup
$app->get('/remove-user', function (Request $request) use ($app) {
	$data = verifySignedRequest($request->get('signed_payload'));
	if (empty($data)) {
		return 'Invalid signed_payload.';
	}

	$key = getUserKey($data['store_hash'], $data['user']['email']);
	$redis = new Credis_Client('localhost');
	$redis->del($key);
	return '[Remove User] ' . $data['user']['email'];
});

/**
 * Configure the static BigCommerce API client with the authorized app's auth token, the client ID from the environment
 * and the store's hash as provided.
 * @param string $storeHash Store hash to point the BigCommece API to for outgoing requests.
 */
function configureBCApi($storeHash)
{
	Bigcommerce::configure(array(
		'client_id' => clientId(),
		'auth_token' => getAuthToken($storeHash),
		'store_hash' => $storeHash
	));
}

/**
 * @param string $storeHash store's hash that we want the access token for
 * @return string the oauth Access (aka Auth) Token to use in API requests.
 */
function getAuthToken($storeHash)
{
	$redis = new Credis_Client('localhost');
	$authData = json_decode($redis->get("stores/{$storeHash}/auth"));
	return $authData->access_token;
}

/**
 * @param string $jwtToken	customer's JWT token sent from the storefront.
 * @return string customer's ID decoded and verified
 */
function getCustomerIdFromToken($jwtToken)
{
	$signedData = JWT::decode($jwtToken, clientSecret(), array('HS256', 'HS384', 'HS512', 'RS256'));
	return $signedData->customer->id;
}

/**
 * This is used by the `GET /load` endpoint to load the app in the BigCommerce control panel
 * @param string $signedRequest Pull signed data to verify it.
 * @return array|null null if bad request, array of data otherwise
 */
function verifySignedRequest($signedRequest)
{
	list($encodedData, $encodedSignature) = explode('.', $signedRequest, 2);

	// decode the data
	$signature = base64_decode($encodedSignature);
	$jsonStr = base64_decode($encodedData);
	$data = json_decode($jsonStr, true);

	// confirm the signature
	$expectedSignature = hash_hmac('sha256', $jsonStr, clientSecret(), $raw = false);
	if (!hash_equals($expectedSignature, $signature)) {
		error_log('Bad signed request from BigCommerce!');
		return null;
	}
	return $data;
}

/**
 * @return string Get the app's client ID from the environment vars
 */
function clientId()
{
	$clientId = getenv('BC_CLIENT_ID');
	return $clientId ?: '';
}

/**
 * @return string Get the app's client secret from the environment vars
 */
function clientSecret()
{
	$clientSecret = getenv('BC_CLIENT_SECRET');
	return $clientSecret ?: '';
}

/**
 * @return string Get the callback URL from the environment vars
 */
function callbackUrl()
{
	$callbackUrl = getenv('BC_CALLBACK_URL');
	return $callbackUrl ?: '';
}

/**
 * @return string Get auth service URL from the environment vars
 */
function bcAuthService()
{
	$bcAuthService = getenv('BC_AUTH_SERVICE');
	return $bcAuthService ?: '';
}

function getUserKey($storeHash, $email)
{
	return "kitty.php:$storeHash:$email";
}

function createWebhook($storeHash, $clientId, $authToken)
{
	$curl = curl_init();
	curl_setopt_array($curl, array(
		CURLOPT_URL => "https://api.bigcommerce.com/stores/${storeHash}/v2/hooks",
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_ENCODING => "",
		CURLOPT_MAXREDIRS => 10,
		CURLOPT_TIMEOUT => 30,
		CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		CURLOPT_CUSTOMREQUEST => "POST",
		CURLOPT_POSTFIELDS => "{\"scope\":\"store/order/created\",\"destination\":\"https://94ed26cf5897.ngrok.io/bigcommerce/webhooks\",\"headers\":{}}",
		CURLOPT_HTTPHEADER => array(
			"accept: application/json",
			"content-type: application/json",
			"x-auth-client: ${clientId}",
			"x-auth-token: ${authToken}"
		),
	));
	curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

	$response = curl_exec($curl);
	$err = curl_error($curl);

	curl_close($curl);
	if ($err) {
		//   echo "cURL Error #:" . $err;
	} else {
		//   echo $response;
	}
}

$app->run();
