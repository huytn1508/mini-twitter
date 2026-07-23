/**
 * Danh sách domain email tạm/rác (disposable/temporary email).
 * Các email này bị chặn khi đăng ký để tránh tài khoản ảo.
 *
 * Nguồn tổng hợp từ các danh sách public:
 * - https://github.com/disposable-email-domains/disposable-email-domains
 * - https://github.com/7c/fakefilter
 *
 * Cập nhật: 2026-07-23
 */
const DISPOSABLE_DOMAINS = new Set([
  // ===== Mailinator & variants =====
  'mailinator.com', 'mailinator.org', 'mailinator.net', 'mailinator.us',
  'mailinator.info', 'mailinator.biz', 'mailinator.tv',
  'zippymail.in', 'reallymymail.com', 'mailnesia.com',
  'mailinater.com', 'mailinator2.com', 'mailinator1.com',
  'notmailinator.com', 'smailinator.com',
  'fmailinator.com', 'devnullmail.com', 'pookmail.com',

  // ===== 10 Minute Mail =====
  '10minutemail.com', '10minutemail.org', '10minutemail.net', '10minutemail.info',
  '10minut.net', '10minutesmail.com', '10minutesmail.net',
  '10minutesmail.org', '10minutesmail.us',
  '10minmail.com', '10minutemail.co.za', '10minutemail.co.za',
  '10minut.xyz',

  // ===== Guerrilla Mail =====
  'guerrillamail.com', 'guerrillamail.org', 'guerrillamail.net',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamailblock.com', 'sharklasers.com', 'pokemail.net',
  'grr.la', 'guerrillamailblock.net',

  // ===== Temp Mail =====
  'tempmail.com', 'tempmail.org', 'tempmail.net', 'tempmail.info',
  'tempmail.de', 'tempmail.ninja', 'tempmail.plus',
  'temp-mail.org', 'temp-mail.net', 'temp-mail.info', 'temp-mail.us',
  'tempemail.co', 'tempemail.net', 'temp-mail.com', 'tempinbox.com',
  'tempinbox.net', 'tempmailo.com', 'tempmails.net',
  'temp-mailbox.com', 'temp-email.info',
  'tmpmail.org', 'tmpmail.net', 'tmpmail.info',
  'tmomail.net', 'temporamail.com', 'tempmail.altmails.com',
  'instantemailaddress.com',

  // ===== YOPmail =====
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'yopmail.org',
  'yopmail.info', 'yopmail.biz', 'yopmail.us',
  'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc', 'nomails.com',

  // ===== Trash Mail =====
  'trashmail.com', 'trashmail.net', 'trashmail.org', 'trashmail.de',
  'trashmail.info', 'trashmail.me', 'trashmail.ws',
  'trash-mail.com', 'trash-mail.net', 'trash-mail.de',
  'trash2009.com', 'trashymail.com', 'trashymail.net',
  'trashdevil.com', 'trashdevil.de',

  // ===== Other popular disposable services =====
  'throwaway.email', 'throwawaymail.com', 'throwaway.email',
  'dispostable.com', 'disposablemail.com', 'discard.email',
  'discardmail.com', 'discardmail.de',
  'maildrop.cc', 'maildrop.dk',
  'harakirimail.com', 'meltmail.com', 'mintemail.com',
  'mytrashmail.com', 'nwytg.com', 'nwytg.net',
  'objectmail.com', 'obobbo.com', 'oneoffemail.com',
  'onewaymail.com', 'oopi.org', 'opayq.com',
  'mailcatch.com', 'mailmetrash.com', 'mailexpire.com',
  'getairmail.com', 'getnada.com', 'gishpuppy.com',
  'gsrv.co.uk', 'gsmtp.co.uk',
  'fakeinbox.com', 'fakeinformation.com', 'fakemail.fr',
  'fakemailgenerator.com', 'fakemailz.com',
  'fastacura.com', 'fastchevy.com', 'fastchrysler.com',
  'flurred.com', 'flyspam.com',
  'emailondeck.com', 'emailfake.com', 'emailgenerator.de',
  'emkei.cz', 'emlpro.com', 'emltmp.com', 'empireanime.xyz',
  'ephemail.net', 'ero-tube.org', 'etranquil.com',
  'evopo.com', 'explodemail.com',
  'ez.lv', 'lvu.me',

  // ===== More temporary services =====
  'spam4.me', 'spamail.de', 'spamarrest.com', 'spamavert.com',
  'spambob.com', 'spambob.net', 'spambob.org',
  'spambog.com', 'spambog.de', 'spambog.net', 'spambog.ru',
  'spambooger.com', 'spambox.info', 'spambox.us',
  'spamcero.com', 'spamcon.org', 'spamdecoy.net',
  'spamex.com', 'spamfree.eu', 'spamfree24.com',
  'spamfree24.net', 'spamfree24.org', 'spamgourmet.com',
  'spamhole.com', 'spamify.com', 'spaminator.de',
  'spamkill.info', 'spaml.com', 'spaml.de',
  'spamoff.de', 'spamstack.com', 'spamsucks.de',
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'wegwerfemail.de', 'wegwerf-email.de', 'weg-werf-email.de',
  'wh4f.org', 'whyspam.me', 'willselfdestruct.com',
  'winemaven.info', 'wmail1.com', 'wronghead.com',
  'wuzup.net', 'wuzupmail.net',

  // ===== 2024-2026 additions =====
  'anonaddy.com', 'anonaddy.me', 'addy.io',
  'simplelogin.com', 'simplelogin.co', 'simplelogin.fr',
  'slmail.me', 'aleeas.com', 'dralias.com', 'duck.com',
  'relay.firefox.com',
  'moakt.com', 'moakt.cc', 'moakt.co',
  'mail.tm', 'mail.gw', 'inboxkitten.com',
  'tempmail.dev', 'tempmail.plus', 'temp-mail.lol',
  'emailnator.com', 'luxusmail.org', 'luxusmail.ml',
  'txcct.com', 'mktmail.com', 'bricketts.com',
  'drmail.in', 'email-temp.com', 'powerencry.com',
  'faxmail.site', 'haqoci.com', 'emaill.homes',
  'hoanggiaanh.com', 'hphanfpt.info', 'spacecorn.xyz',
  'thaco.live', 'bugfoo.com', 'muaemail.com',
  'emailfake.ml', 'emailfake.gq',

  // ===== Vietnamese disposable =====
  'taikhoanmienphi.com', 'emailvl.com', 'gmailvn.com',
  'mailz.info', 'guerillamail.info',
]);

/**
 * Kiểm tra email có dùng domain rác không.
 * @param {string} email
 * @returns {{ blocked: boolean, domain: string | null }}
 */
function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return { blocked: false, domain: null };
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return { blocked: false, domain: null };
  const domain = parts[1];
  return { blocked: DISPOSABLE_DOMAINS.has(domain), domain };
}

module.exports = { DISPOSABLE_DOMAINS, isDisposableEmail };
