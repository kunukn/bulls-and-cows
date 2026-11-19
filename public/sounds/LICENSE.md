# Sound credits

All sounds are by Kenney (www.kenney.nl), released under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

| File                    | Source pack                                                 | Original file                        |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `peg-1.wav`–`peg-5.wav` | [Impact Sounds](https://kenney.nl/assets/impact-sounds) 1.0 | `impactGeneric_light_000`–`_004`     |
| `thud.wav`              | Impact Sounds                                               | `impactSoft_medium_000`              |
| `shield.wav`            | Impact Sounds                                               | `impactWood_light_000`               |
| `win.mp3`               | [Music Jingles](https://kenney.nl/assets/music-jingles)     | `jingles_PIZZI10` (rising D–E–F♯–G)  |
| `lose.mp3`              | Music Jingles                                               | `jingles_PIZZI11` (falling G–F♯–E–D) |

Short hits are trimmed WAV (no codec padding, so they land with the
animation); jingles are MP3, where a few ms of lead-in doesn't matter.

```sh
# Hits: trim leading silence, −3 dB, short fade-out, mono 32 kHz WAV
ffmpeg -i impactGeneric_light_000.ogg \
  -af "silenceremove=start_periods=1:start_threshold=-50dB,volume=-3dB,afade=t=out:st=0.1:d=0.04" \
  -ac 1 -ar 32000 -c:a pcm_s16le -t 0.14 peg-1.wav

# Jingles: −3 dB, mono 64 kbps MP3
ffmpeg -i jingles_PIZZI10.ogg -af volume=-3dB -ac 1 -ar 44100 \
  -c:a libmp3lame -b:a 64k win.mp3
```
