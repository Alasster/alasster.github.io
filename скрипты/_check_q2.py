import io
import re
import sys

path = sys.argv[1]
src = io.open(path, encoding='utf-8').read()
ids = re.findall(r"Q2\.add\('([^']+)'", src)
print(len(ids))
for i in ids:
    print(i)
