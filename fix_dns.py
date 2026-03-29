import sqlite3, shutil, os, subprocess, hashlib, urllib.request, urllib.parse, json
from Crypto.Cipher import AES

# Decrypt Chrome cookie
key_raw = subprocess.check_output(['security', 'find-generic-password', '-a', 'Chrome', '-s', 'Chrome Safe Storage', '-w']).strip()
key = hashlib.pbkdf2_hmac('sha1', key_raw, b'saltysalt', 1003, dklen=16)

def decrypt(enc):
    if not enc or enc[:3] != b'v10':
        return enc.decode('utf-8', errors='replace')
    enc = enc[3:]
    iv = b' ' * 16
    dec = AES.new(key, AES.MODE_CBC, IV=iv).decrypt(enc)
    return dec[:-dec[-1]].decode('utf-8', errors='replace')

src = os.path.expanduser('~/Library/Application Support/Google/Chrome/Default/Cookies')
shutil.copy2(src, '/tmp/cc.db')
conn = sqlite3.connect('/tmp/cc.db')
cur = conn.cursor()
cur.execute("SELECT name, encrypted_value FROM cookies WHERE host_key LIKE '%das107%'")
cookies = {name: decrypt(enc) for name, enc in cur.fetchall()}
conn.close()

session = cookies.get('cpsession', '')
print(f"Session: {session[:30]}...")

# Use curl via subprocess (handles SSL better)
import subprocess

def cpanel_api(endpoint, params=None):
    url = f"https://das107.truehost.cloud:2083/execute/{endpoint}"
    if params:
        url += '?' + urllib.parse.urlencode(params)
    result = subprocess.check_output([
        'curl', '-sk', url,
        '-H', f'Cookie: cpsession={urllib.parse.quote(session)}',
        '-H', 'Accept: application/json'
    ])
    return json.loads(result)

# Step 1: Fetch all DNS records for wealthwithkwanele.co.za
print("\nFetching DNS records...")
data = cpanel_api('ZoneEdit/fetch_zone_records', {'domain': 'wealthwithkwanele.co.za'})

if data.get('status') != 1:
    print("Auth failed:", data)
    exit(1)

records = data.get('data', {}).get('record', [])
fundi_records = [r for r in records if 'fundi' in str(r.get('name', ''))]
print(f"\nFundi records found: {len(fundi_records)}")
for r in fundi_records:
    print(f"  line={r.get('line')} type={r.get('type')} name={r.get('name')} address={r.get('address')}")
