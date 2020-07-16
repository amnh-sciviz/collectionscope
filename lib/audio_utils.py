import array
import math
import numpy as np
import os
from pydub import AudioSegment
from pysndfx import AudioEffectsChain

import lib.io_utils as io
import lib.math_utils as mu

def applyReverb(sound, value, pad=1000, fade_in=10, fade_out=10):
    if value <= 0:
        return sound

    # Add padding
    if pad > 0:
        sound += AudioSegment.silent(duration=pad, frame_rate=sound.frame_rate)

    # convert pydub sound to np array
    samples = np.array(sound.get_array_of_samples())
    samples = samples.astype(np.int16)

    chain = AudioEffectsChain()
    chain.reverb(reverberance=value)

    # apply reverb effect
    fx = (chain)
    y = fx(samples)

    # convert it back to an array and create a new sound clip
    newData = array.array(sound.array_type, y)
    newSound = sound._spawn(newData)
    dur = len(newSound)
    newSound = newSound.fade_in(min(fade_in, dur)).fade_out(min(fade_out, dur))
    return newSound

def getAudio(filename, sampleWidth=2, sampleRate=48000, channels=2):
    audio = AudioSegment.from_file(filename)
    # convert to stereo
    if audio.channels != channels:
        audio = audio.set_channels(channels)
    # convert sample width
    if audio.sample_width != sampleWidth:
        audio = audio.set_sample_width(sampleWidth)
    # convert sample rate
    if audio.frame_rate != sampleRate:
        audio = audio.set_frame_rate(sampleRate)
    return audio

def getAudioClip(audio, clipStart, clipDur, clipFadeIn=10, clipFadeOut=10):
    audioDurationMs = len(audio)
    clipEnd = None
    if clipDur > 0:
        clipEnd = clipStart + clipDur
    else:
        clipEnd = audioDurationMs
    # check bounds
    clipStart = mu.lim(clipStart, (0, audioDurationMs))
    clipEnd = mu.lim(clipEnd, (0, audioDurationMs))
    if clipStart >= clipEnd:
        return None

    newClipDur = clipEnd - clipStart
    clip = audio[clipStart:clipEnd]

    # add a fade in/out to avoid clicking
    fadeInDur = min(clipFadeIn, newClipDur)
    fadeOutDur = min(clipFadeOut, newClipDur)
    if fadeInDur > 0 or fadeOutDur > 0:
        clip = clip.fade_in(fadeInDur).fade_out(fadeOutDur)

    return clip

def getBlankAudio(duration, sampleWidth=2, sampleRate=48000, channels=2):
    audio = AudioSegment.silent(duration=duration, frame_rate=sampleRate)
    audio = audio.set_channels(channels)
    audio = audio.set_sample_width(sampleWidth)
    return audio

def makeSpriteFile(audioFn, dataFn, filenames, dur, matchDbValue=-9, reverb=0, quantities=None, sampleWidth=2, sampleRate=48000, channels=2):
    totalDuration = dur * len(filenames)
    if quantities is not None:
        totalDuration *= len(quantities)

    baseAudio = getBlankAudio(totalDuration, sampleWidth, sampleRate, channels)
    sprites = []

    for i, fn in enumerate(filenames):
        audio = getAudio(fn, sampleWidth, sampleRate, channels)
        audio = matchDb(audio, matchDbValue) # normalize audio
        if reverb > 0:
            audio = applyReverb(audio, reverb)

        if quantities is not None:
            for j, q in enumerate(quantities):
                sectionStart = i * len(quantities) * dur + j * dur
                sectionBaseAudio = getBlankAudio(dur, sampleWidth, sampleRate, channels)
                volumeRange = (0.2, 0.8)
                count = q["count"]
                clipDur = int(1.0 * dur / q["count"])
                audioClip = getAudioClip(audio, 0, clipDur, clipFadeIn=10, clipFadeOut=10)
                for k in range(q["count"]):
                    p = 1.0 * k / (q["count"]-1)
                    volume = mu.lerp((volumeRange[1], volumeRange[0]), p)
                    qstart = k * clipDur
                    dbAdjust = volumeToDb(volume)
                    modifiedAudio = audioClip.apply_gain(dbAdjust)
                    sectionBaseAudio = sectionBaseAudio.overlay(modifiedAudio, position=qstart)
                audioDur = len(sectionBaseAudio)
                # clip audio if necessary
                if audioDur > dur:
                    sectionBaseAudio = sectionBaseAudio[:dur]
                # fade in and out
                sectionBaseAudio = sectionBaseAudio.fade_in(10).fade_out(20)
                baseAudio = baseAudio.overlay(sectionBaseAudio, position=sectionStart)
                sprite = {
                    "src": os.path.basename(fn),
                    "start": sectionStart,
                    "dur": dur,
                    "quantity": q["name"]
                }
                sprites.append(sprite)
        else:
            start = i*dur
            audioDur = len(audio)
            # clip audio if necessary
            if audioDur > dur:
                audio = audio[:dur]
            # fade in and out
            audio = audio.fade_in(10).fade_out(20)
            # paste section on base audio
            baseAudio = baseAudio.overlay(audio, position=start)
            sprite = {
                "src": os.path.basename(fn),
                "start": start,
                "dur": dur
            }
            sprites.append(sprite)

    format = os.path.basename(audioFn).split(".")[-1]
    baseAudio.export(audioFn, format=format)
    jsonOut = {
        "name": os.path.basename(audioFn),
        "sprites": sprites
    }
    io.writeJSON(dataFn, jsonOut, pretty=True)

def matchDb(audio, targetDb, maxMatchDb=None, useMaxDBFS=True):
    if maxMatchDb is not None:
        targetDb = min(targetDb, maxMatchDb)
    deltaDb = 0
    if useMaxDBFS:
        deltaDb = targetDb - audio.max_dBFS
    else:
        deltaDb = targetDb - audio.dBFS
    # if maxMatchDb is not None:
    #     deltaDb = min(deltaDb, maxMatchDb)
    # print(deltaDb)
    return audio.apply_gain(deltaDb)

def volumeToDb(volume):
    db = 0.0
    if 0.0 < volume < 1.0 or volume > 1.0:
        db = 10.0 * math.log(volume**2)
    return db
