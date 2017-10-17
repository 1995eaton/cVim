from collections import OrderedDict
import re
import json

data = json.load(open('manifest.json'))

def remove_dups(*groups):
    result = []
    for e in groups:
        for m in e:
            if m not in result:
                result.append(m)
    return result

def generate_code(dirs, files):
    files = remove_dups(files)
    code = ''
    roots = {}
    for e in files:
        a, b = e.split('/')
        if a not in roots:
            roots[a] = ''
        text = open(e).read() + '\n'
        lines = text.split('\n')
        for i, m in enumerate(lines):
            if m:
                m = m + ' //' + e + ': ' + str(i + 1)
            lines[i] = m

        roots[a] += '\n'.join(lines)
    for d, opts in dirs.items():
        block = roots[d] + '\n'
        if opts['wrap']:
            block = re.sub(r'^(.)', r'    \1', block, flags=re.M)
            code += '(() => {\n' + block + '})();\n\n'
        else:
            code += block
    print(code)

dirs = OrderedDict([
    ('shared_scripts', {
        'wrap': False,
    }),
    ('background_scripts', {
        'wrap': True,
    }),
    ('content_scripts', {
        'wrap': True,
    })
])

bg = data['background']['scripts']
fg = data['content_scripts'][0]['js']

generate_code(dirs, bg + fg)
