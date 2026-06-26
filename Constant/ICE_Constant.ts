// All entries were verified live (STUN binding request -> success response)
// before being added. STUN only handles public-address discovery; strict
// networks may still need a TURN relay (see useWebRTC.ts).
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'stun:stun.nextcloud.com:443' },
  { urls: 'stun:stun.framasoft.org:3478' },
]