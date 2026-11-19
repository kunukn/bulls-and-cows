# Sound credits

`peg-1.wav` … `peg-5.wav` are `impactGeneric_light_000` … `_004` from
[Impact Sounds](https://kenney.nl/assets/impact-sounds) (1.0) by Kenney
(www.kenney.nl), released under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

Trimmed, mono, 32 kHz, −3 dB, 40 ms fade-out:

```sh
ffmpeg -i impactGeneric_light_000.ogg \
  -af "silenceremove=start_periods=1:start_threshold=-50dB,volume=-3dB,afade=t=out:st=0.1:d=0.04" \
  -ac 1 -ar 32000 -c:a pcm_s16le -t 0.14 peg-1.wav
```
