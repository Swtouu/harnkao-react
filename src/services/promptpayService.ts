// EMVCo QR payload for Thai PromptPay (same format as the promptpay-qr reference lib)

const AID_MERCHANT = 'A000000677010111'

function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value
}

// CRC-16/CCITT-FALSE, per EMVCo spec: computed over the payload including the '6304' prefix
function crc16(s: string): string {
  let crc = 0xffff
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Accepts a Thai mobile number (10 digits), national ID (13) or e-wallet ID (15)
export function normalizePromptPayId(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, '')
  if (digits.length === 10 && digits.startsWith('0')) return digits
  if (digits.length === 13 || digits.length === 15) return digits
  return null
}

export function buildPromptPayPayload(target: string, amountTHB: number): string {
  const digits = target.replace(/[^0-9]/g, '')
  const account =
    digits.length === 10 ? tlv('01', '0066' + digits.slice(1)) :
    digits.length === 13 ? tlv('02', digits) :
                           tlv('03', digits)

  const body =
    tlv('00', '01') +
    tlv('01', '12') +                                // dynamic: amount is embedded
    tlv('29', tlv('00', AID_MERCHANT) + account) +
    tlv('58', 'TH') +
    tlv('53', '764') +                               // THB
    tlv('54', amountTHB.toFixed(2)) +
    '6304'

  return body + crc16(body)
}
