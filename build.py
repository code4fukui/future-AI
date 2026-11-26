# deck.js（日本語のまま編集する元ファイル）を、ASCIIだけの build/deck.js に書き出す
import re
s = open('deck.js', encoding='utf-8').read()
out = ''.join(c if ord(c) < 128 else ('\\u%04x' % ord(c) if ord(c) < 0x10000 else ''.join('\\u%04x' % u for u in __import__('struct').unpack('<2H', c.encode('utf-16-le')))) for c in s)
open('build/deck.js', 'w', encoding='ascii').write(out)
