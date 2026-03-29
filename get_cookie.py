import sqlite3, shutil, os, subprocess, hashlib
from Crypto.Cipher import AES

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
for name, enc in cur.fetchall():
    print(name, '=', decrypt(enc))
conn.close()
