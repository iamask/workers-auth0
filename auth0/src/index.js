const auth0Domain = 'zxcc.eu.auth0.com';
const clientId = '6lciv0NSq6ziASs1g6gi5GIjBxK5MhAD';
const clientSecret = 'byz9aCGyUXwbG021QUZl6GEEqIv_T5johnAXezNGC1hwT6Jr-MxGhk2ah8COfXjo';
const redirectUri = 'https://key.zxc.co.in/callback';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/auth0login') {
      return redirectToAuth0();
    } else if (url.pathname === '/callback') {
      return handleCallback(request);
    } else if (url.pathname === '/') {
      return new Response(await fetch('https://r2.zxc.co.in/auth0.html'));
    }

    return new Response('Not Found', { status: 404 });
  }
};

function redirectToAuth0() {
  const authUrl = `https://${auth0Domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`;

  return new Response(JSON.stringify({ authUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleCallback(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Authorization code not found', { status: 400 });
  }

  const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  const tokenData = await tokenResponse.json();

  if (tokenResponse.ok) {
    const userInfoResponse = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const userInfo = await userInfoResponse.json();

    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
      </head>
      <body>
        <h1>Welcome, ${userInfo.name}</h1>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } else {
    return new Response('Failed to fetch tokens', { status: 500 });
  }
}
