import math
import os
from pydub import AudioSegment

import lib.io_utils as io
import lib.math_utils as mu

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

def getBlankAudio(duration, sampleWidth=2, sampleRate=48000, channels=2):
    audio = AudioSegment.silent(duration=duration, frame_rate=sampleRate)
    audio = audio.set_channels(channels)
    audio = audio.set_sample_width(sampleWidth)
    return audio

def makeSpriteFile(audioFn, dataFn, filenames, dur, quantities=None, sampleWidth=2, sampleRate=48000, channels=2):
    totalDuration = dur * len(filenames)
    if quantities is not None:
        totalDuration *= len(quantities)

    baseAudio = getBlankAudio(totalDuration, sampleWidth, sampleRate, channels)
    sprites = []

    for i, fn in enumerate(filenames):
        audio = getAudio(fn, sampleWidth, sampleRate, channels)
        audio = matchDb(audio, -6) # normalize audio

        if quantities is not None:
            for j, q in enumerate(quantities):
                sectionStart = i * len(quantities) * dur + j * dur
                sectionBaseAudio = getBlankAudio(dur, sampleWidth, sampleRate, channels)
                volumeRange = (0.1, 0.8)
                for k in range(q["count"]):
                    volume = mu.randomUniform(volumeRange[0], volumeRange[1])
                    qstart = mu.roundInt(mu.randomUniform(0, dur*0.75))
                    dbAdjust = volumeToDb(volume)
                    modifiedAudio = audio.apply_gain(dbAdjust)
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
