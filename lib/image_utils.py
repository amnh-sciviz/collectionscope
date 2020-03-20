from PIL import Image

import lib.math_utils as mu

def containImage(img, w, h, resampleType="default", bgcolor=[0,0,0]):
    # Lanczos = good for downsizing
    resampleType = Image.LANCZOS if resampleType=="default" else resampleType
    vw, vh = img.size

    if vw == w and vh == h:
        return img

    # create a base image
    w = mu.roundInt(w)
    h = mu.roundInt(h)
    if img.mode=="RGBA" and len(bgcolor)==3:
        bgcolor.append(0)
    baseImg = Image.new(mode=img.mode, size=(w, h), color=tuple(bgcolor))

    ratio = 1.0 * w / h
    vratio = 1.0 * vw / vh

    # first, resize image
    newW = w
    newH = h
    pasteX = 0
    pasteY = 0
    if vratio > ratio:
        newH = w / vratio
        pasteY = mu.roundInt((h-newH) * 0.5)
    else:
        newW = h * vratio
        pasteX = mu.roundInt((w-newW) * 0.5)
    try:
        resized = img.resize((mu.roundInt(newW), mu.roundInt(newH)), resample=resampleType)
        # then paste the resized image
        baseImg.paste(resized, (pasteX, pasteY))
    except OSError:
        print("Error in resizing")
        baseImg = None

    return baseImg

def readImage(fn, mode="RGB"):
    img = None
    try:
        img = Image.open(fn)
        if mode != img.mode:
            img = img.convert(mode)
    except OSError:
        print("Image error for %s" % fn)
        img = None
    return img

def savePixelsToImage(fn, pixels):
    h, w, colors = pixels.shape
    colorMode = "RGB" if colors == 3 else "RGBA"
    img = Image.fromarray(pixels, mode=colorMode)
    img.save(fn)
    print("Saved image %s" % fn)
