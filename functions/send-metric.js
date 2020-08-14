const https = require('https');
const functions = require('firebase-functions');

const DATA_DOG_API_KEY = functions.config().datadog.apikey;

function sendMetric(metricName, tags, value) {
  if (!metricName || !tags) {
    throw Error('Missing metricName, tags, or value!');
  }

  try {
    console.log(`Sending coverage to DataDog...`);
    const currentTime = Math.floor(Date.now() / 1000);
    const data = JSON.stringify({
      series: [
        {
          metric: metricName,
          points: [[currentTime, value]],
          type: 'gauge',
          tags: tags,
        },
      ],
    });

    const options = {
      hostname: `api.datadoghq.com`,
      port: 443,
      path: `/api/v1/series?api_key=${DATA_DOG_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, res => {
      console.log(`statusCode: ${res.statusCode}`);

      res.on('data', d => {
        process.stdout.write(d);
      });
    });

    req.on('error', error => {
      console.error(error);
    });

    req.write(data);
    req.end();
  } catch (e) {
    console.log(`Failed sending coverage data to DataDog`);
    throw e;
  }
}

module.exports = {sendMetric};
