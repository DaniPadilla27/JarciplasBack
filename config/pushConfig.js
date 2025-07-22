const webpush = require('web-push');

// Genera tus claves una sola vez con: webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  'mailto:paca23919@gmail.com',
  'BGiJD7Rg1_BAC2w45aULBCSVcR2hoquJsTfZGYzFuf-AoMnrPfW2SpVVT_epwFMi6IYgou5LezD_5ALbdQ0mK6Y',
  'sI_n1YXwxK_QdX1sf4E01Xb7IiKZ7_CjvAG0g64axQ4'
);

module.exports = webpush;
