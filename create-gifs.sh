#!/bin/bash
# Script para gerar GIFs otimizados a partir dos frames do ScreenToGif
FFMPEG="c:/Users/tamym/NardotoStudio/node_modules/ffmpeg-static/ffmpeg.exe"
SRC="c:/Users/tamym/AppData/Local/Temp/ScreenToGif/Recording/2026-03-09 15-58-01"
OUT="c:/Users/tamym/NardotoStudio/landing/gifs"
TEMP="c:/Users/tamym/NardotoStudio/landing/gifs/_temp"

# Funcao: copia frames de um range, renumerando sequencialmente
copy_frames() {
  local start=$1 end=$2 offset=$3
  local idx=$offset
  for ((i=start; i<=end; i++)); do
    local padded=$(printf "%05d" $idx)
    cp "$SRC/$i.png" "$TEMP/$padded.png" 2>/dev/null
    idx=$((idx+1))
  done
  echo $idx
}

# Funcao: gera GIF otimizado com 2-pass palette
make_gif() {
  local name=$1
  local fps=${2:-10}
  echo "Gerando $name..."
  "$FFMPEG" -y -framerate $fps -i "$TEMP/%05d.png" \
    -vf "scale=800:-1:flags=lanczos,palettegen=stats_mode=diff" \
    "$TEMP/palette.png" -loglevel error
  "$FFMPEG" -y -framerate $fps -i "$TEMP/%05d.png" -i "$TEMP/palette.png" \
    -lavfi "scale=800:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" \
    "$OUT/$name" -loglevel error
  local size=$(du -h "$OUT/$name" | cut -f1)
  echo "  -> $OUT/$name ($size)"
}

# Limpa e cria temp
clean_temp() {
  rm -rf "$TEMP"
  mkdir -p "$TEMP"
}

echo "=== Gerando GIFs da gravacao ==="
echo ""

# 01 - Imagens (22-404)
clean_temp
copy_frames 22 404 1
make_gif "01-imagens.gif"

# 02 - Fluxo parte 2 (803-1170, 1230-1417)
clean_temp
offset=$(copy_frames 803 1170 1)
copy_frames 1230 1417 $offset
make_gif "02-fluxo.gif"

# 03 - Fluxo parte 3 (1420-1560, 1730-1938, 3500-3900)
clean_temp
offset=$(copy_frames 1420 1560 1)
offset=$(copy_frames 1730 1938 $offset)
copy_frames 3500 3900 $offset
make_gif "03-fluxo2.gif"

# 04 - Gerar SRT (2090-2390, 2438-2540)
clean_temp
offset=$(copy_frames 2090 2390 1)
copy_frames 2438 2540 $offset
make_gif "04-gerar-srt.gif"

# 05 - Gerando audio no CapCut (3050-3150)
clean_temp
copy_frames 3050 3150 1
make_gif "05-audio-capcut.gif"

# 06 - Mostrando preview (3240-3439)
clean_temp
copy_frames 3240 3439 1
make_gif "06-preview.gif"

# 07 - Enviar SRT pro chat gerar imagens (3885-4430)
clean_temp
copy_frames 3885 4430 1
make_gif "07-srt-imagens.gif"

# 08 - Chat respondendo (4500-4860)
clean_temp
copy_frames 4500 4860 1
make_gif "08-chat-respondendo.gif"

# 09 - Flow + VEO3 (4861-5570, 6607-7360)
clean_temp
offset=$(copy_frames 4861 5570 1)
copy_frames 6607 7360 $offset
make_gif "09-flow-veo3.gif"

# 10 - Epidemic Sound (5571-6540)
clean_temp
copy_frames 5571 6540 1
make_gif "10-epidemic-sound.gif"

# 11 - Arrastar midias + sincronizar (7335-7805)
clean_temp
copy_frames 7335 7805 1
make_gif "11-timeline-sync.gif"

# 12 - Conferindo CapCut (8180-8350)
clean_temp
copy_frames 8180 8350 1
make_gif "12-capcut-conferindo.gif"

# Limpa temp
rm -rf "$TEMP"

echo ""
echo "=== Concluido! ==="
echo "GIFs salvos em: $OUT"
ls -lh "$OUT"/*.gif
