<#
  voice-clip.ps1 -- render a spoken line to a small mp3 for the games' voice clips (DEEP16's deep16/audio/*.mp3: come_on_down, the cloaker's two lines,
  denim_damage). The same recipe, written down (10-07; the cloaker's was never saved): Windows' own voice (System.Speech, the SAPI voices on the PC) says the
  line to a wav, then ffmpeg pitches it, sets its speed, adds a touch of echo and writes it as a small mono mp3. The game plays it with D.clip(path, done) and
  falls back to D.say(text, {pitch, rate}) (the browser's own voice) when the clip will not play -- see deep16/js/ai.js `whistle`, js/mpmon.js `denimVoice`.

  One command per clip, from the repo root, in PowerShell:
    powershell -ExecutionPolicy Bypass -File tools\voice-clip.ps1 -Text "Denim | damage!" -Out deep16\audio\denim_damage.mp3 -Voice David -Pitch -2 -Slow 1.0 -Echo 140 -Emphasis Strong
    powershell -File tools\voice-clip.ps1 -ListVoices

  -Text      the line. A "|" in it is a beat of silence (-Pause ms, 280 by default; the voice adds its own) between two runs of words: "Denim | damage!" says Denim, waits, says damage.
  -Out       the mp3 to write (made, with its folder, if need be; an existing file is replaced).
  -Voice     part of an installed voice's name ("David", "Zira"); -ListVoices lists them. Default Zira, the cloaker's and Hallvor's voice.
  -Rate      the voice's own speed, -10 slow to 10 fast (SAPI), 0 default.   -Emphasis None | Reduced | Moderate | Strong (the whole line).
  -Pitch     semitones, negative lower (-2 a touch deeper, -5 a growl). The pitch is moved the tape's way (ffmpeg asetrate: the voice's whole body goes deeper, a bigger
             voice) and the speed that takes with it is made up for, so -Slow alone sets the pace: 1.0 the voice's own speed, 0.85 slower, 1.1 quicker.
  -Echo      ms of the echo's delay (0 none; 90-160 a room, 300 a hall); -EchoDecay its strength 0..1 (0.3 a touch).
  -Gain      dB on the end (0 none; the limiter keeps it from clipping).   -Bitrate  mp3 kbps (64 default: the clips are 23-31 KB).   -Keep   keep the wav beside it.
  ffmpeg: on PATH, or C:\ffmpeg\bin\ffmpeg.exe. Needs only PowerShell 5.1 + that: no installs. The clip is silent in a headless page (no click has unlocked sound): listen to it
  in a browser, or play the mp3.
#>
param(
  [string]$Text,
  [string]$Out,
  [string]$Voice = 'Zira',
  [int]$Rate = 0,
  [ValidateSet('None', 'Reduced', 'Moderate', 'Strong')][string]$Emphasis = 'None',
  [double]$Pitch = 0,
  [double]$Slow = 1.0,
  [int]$Echo = 0,
  [double]$EchoDecay = 0.3,
  [double]$Gain = 0,
  [int]$Pause = 280,
  [int]$Bitrate = 64,
  [switch]$Keep,
  [switch]$ListVoices
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$syn = New-Object System.Speech.Synthesis.SpeechSynthesizer
if ($ListVoices) {
  $syn.GetInstalledVoices() | ForEach-Object { $i = $_.VoiceInfo; '{0} | {1} | {2} | {3}' -f $i.Name, $i.Culture, $i.Gender, $i.Age }
  return
}
if (-not $Text -or -not $Out) { throw 'say -Text and -Out (see the head of this file), or -ListVoices' }

# ffmpeg
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ff -and (Test-Path 'C:\ffmpeg\bin\ffmpeg.exe')) { $ff = 'C:\ffmpeg\bin\ffmpeg.exe' }
if (-not $ff) { throw 'ffmpeg is not on PATH (and not at C:\ffmpeg\bin)' }

# the voice
$names = @($syn.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name })
$pick = @($names | Where-Object { $_ -like "*$Voice*" })[0]
if (-not $pick) { throw ('no voice like "{0}"; installed: {1}' -f $Voice, ($names -join ', ')) }
$syn.SelectVoice($pick)
$syn.Rate = $Rate
$syn.Volume = 100

# the line, to a wav (44.1 kHz mono 16-bit: ffmpeg works from there)
$outFull = if ([System.IO.Path]::IsPathRooted($Out)) { [System.IO.Path]::GetFullPath($Out) } else { [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Out)) }
$dir = Split-Path $outFull -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
$wav = [System.IO.Path]::ChangeExtension($outFull, '.wav')
$syn.SetOutputToWaveFile($wav, (New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(44100, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)))
$pb = New-Object System.Speech.Synthesis.PromptBuilder
$pb.Culture = $syn.Voice.Culture
$style = New-Object System.Speech.Synthesis.PromptStyle
$style.Emphasis = [System.Speech.Synthesis.PromptEmphasis]$Emphasis
$parts = $Text -split '\|'
for ($k = 0; $k -lt $parts.Count; $k++) {
  $w = $parts[$k].Trim()
  if ($w) { $pb.StartStyle($style); $pb.AppendText($w); $pb.EndStyle() }
  if ($k -lt $parts.Count - 1) { $pb.AppendBreak([TimeSpan]::FromMilliseconds($Pause)) }
}
$syn.Speak($pb)
$syn.SetOutputToNull()
$syn.Dispose()

# the pitch (asetrate: the tape's way), the speed it leaves, a tail for the echo, the echo, the limiter
$sr = 44100
$f = [Math]::Pow(2, $Pitch / 12)
$tempo = $Slow / $f                      # atempo takes 0.5..2 a step: chain what is out of range
$tempos = @()
while ($tempo -gt 2.0) { $tempos += 2.0; $tempo = $tempo / 2.0 }
while ($tempo -lt 0.5) { $tempos += 0.5; $tempo = $tempo / 0.5 }
$tempos += $tempo
$chain = @('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03', 'areverse', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03', 'areverse') # (the voice's own silence off both ends)
if ([Math]::Abs($f - 1.0) -gt 0.001) { $chain += ('asetrate={0}' -f [int]($sr * $f)); $chain += ('aresample={0}' -f $sr) }
foreach ($t in $tempos) { if ([Math]::Abs($t - 1.0) -gt 0.001) { $chain += ('atempo={0}' -f $t.ToString('0.####', [Globalization.CultureInfo]::InvariantCulture)) } }
$inv = [Globalization.CultureInfo]::InvariantCulture
if ($Echo -gt 0) {
  $chain += ('apad=pad_dur={0}' -f (($Echo * 3 / 1000.0).ToString('0.###', $inv)))
  $chain += ('aecho=0.85:0.7:{0}:{1}' -f $Echo, $EchoDecay.ToString('0.###', $inv))
} else { $chain += 'apad=pad_dur=0.08' }
if ([Math]::Abs($Gain) -gt 0.01) { $chain += ('volume={0}dB' -f $Gain.ToString('0.##', $inv)) }
$chain += 'alimiter=limit=0.9'
$filter = $chain -join ','

& $ff -hide_banner -loglevel error -y -i $wav -af $filter -ac 1 -ar $sr -c:a libmp3lame -b:a ("{0}k" -f $Bitrate) $outFull
if ($LASTEXITCODE -ne 0) { throw 'ffmpeg failed' }
if (-not $Keep) { Remove-Item $wav -Force }
$len = (Get-Item $outFull).Length
'{0}: {1} bytes, voice {2}, pitch {3} st, slow {4}, echo {5} ms; filter: {6}' -f $outFull, $len, $pick, $Pitch, $Slow, $Echo, $filter
