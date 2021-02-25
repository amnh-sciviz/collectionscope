import math
import random
import sys

def addNormalizedValues(arr, key, nkey):
    if len(arr) < 1:
        return arr
    values = [v[key] for v in arr]
    range = (min(values), max(values))
    for i, entry in enumerate(arr):
        arr[i][nkey] = norm(entry[key], range)
    return arr

def ceilInt(value):
    return int(math.ceil(value))

def isInteger(value):
    return isinstance(value, int)

def isNumeric(value):
    if value == "":
        return False
    response = True
    try:
        num = float(value)
    except ValueError:
        response = False
    return response

def lerp(ab, amount):
    a, b = ab
    return (b-a) * amount + a

def lim(value, ab=(0, 1)):
    a, b = ab
    return max(a, min(b, value))

def norm(value, ab, limit=False):
    a, b = ab
    n = 0.0
    if (b - a) != 0:
        n = 1.0 * (value - a) / (b - a)
    if limit:
        n = lim(n)
    return n

def parseNumber(string, alwaysFloat=False, invalidValue="self"):
    try:
        num = float(string)
        if "." not in str(string) and not alwaysFloat:
            num = int(string)
        return num
    except ValueError:
        if invalidValue == "self":
            return string
        else:
            return invalidValue

def parseNumbers(arr):
    for i, item in enumerate(arr):
        if isinstance(item, (list,)):
            for j, v in enumerate(item):
                arr[i][j] = parseNumber(v)
        else:
            for key in item:
                if key != "id":
                    arr[i][key] = parseNumber(item[key])
    return arr

def printProgress(step, total, prepend=""):
    sys.stdout.write('\r')
    sys.stdout.write("%s%s%%" % (prepend, round(1.0*step/total*100,2)))
    sys.stdout.flush()

def randomPointInSphere(center, radius, seed=None):
    if seed is not None:
        random.seed(seed)
    phi = random.uniform(0, 2*math.pi)
    if seed is not None:
        random.seed(seed+1)
    costheta = random.uniform(-1, 1)
    if seed is not None:
        random.seed(seed+2)
    u = random.random()
    theta = math.acos(costheta)
    r = radius * (u ** (1. / 3))

    x = r * math.sin(theta) * math.cos(phi)
    y = r * math.sin(theta) * math.sin(phi)
    z = r * math.cos(theta)

    return (center[0]+x, center[1]+y, center[2]+z)

def randomUniform(fromValue=0, toValue=1.0, seed=None):
    if seed is not None:
        random.seed(seed)
    return random.uniform(fromValue, toValue)

def roundInt(value):
    return int(round(value))

# East = 0 degrees
def translatePoint(x, y, distance, angle, radians=False):
    rad = angle if radians else math.radians(angle)
    x2 = x + distance * math.cos(rad)
    y2 = y + distance * math.sin(rad)
    return (x2, y2)
