#!/usr/bin/env bash
# simulate-call.sh - Push a fake call recording to the Android emulator
# to trigger MindShield's file watcher pipeline.
#
# Usage:
#   ./scripts/simulate-call.sh                  # Generate and push a test recording
#   ./scripts/simulate-call.sh my-audio.m4a     # Push an existing .m4a file
#   ./scripts/simulate-call.sh --scam           # Generate a longer "scam-like" recording
#
# Requires: adb (Android SDK), ffmpeg (for generating test audio)

set -euo pipefail

WATCH_DIR="/storage/emulated/0/Recordings/Call"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PHONE_NUMBERS=("555-0101" "555-0142" "555-0178" "555-0199" "555-0200" "800-555-0123" "900-555-0456")
RANDOM_PHONE=${PHONE_NUMBERS[$((RANDOM % ${#PHONE_NUMBERS[@]}))]}
FILE_NAME="Call_${RANDOM_PHONE}_${TIMESTAMP}.m4a"
TMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# Ensure the watched directory exists on the emulator
adb shell mkdir -p "$WATCH_DIR" 2>/dev/null || true

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    echo "Usage:"
    echo "  ./scripts/simulate-call.sh                  # Push a generated test recording"
    echo "  ./scripts/simulate-call.sh <file.m4a>       # Push an existing .m4a file"
    echo "  ./scripts/simulate-call.sh --scam           # Generate a longer scam-like recording"
    echo "  ./scripts/simulate-call.sh --batch N        # Generate N test recordings at once"
    exit 0
fi

# If a file is provided, push it directly
if [[ -n "${1:-}" && -f "${1:-}" ]]; then
    echo "Pushing '$1' as $FILE_NAME ..."
    adb push "$1" "$WATCH_DIR/$FILE_NAME"
    echo "Done. File pushed to $WATCH_DIR/$FILE_NAME"
    exit 0
fi

# Check for ffmpeg
if ! command -v ffmpeg &>/dev/null; then
    echo "Error: ffmpeg is required to generate test audio."
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

DURATION=5
if [[ "${1:-}" == "--scam" ]]; then
    DURATION=30
    echo "Generating ${DURATION}s scam-style test recording..."
elif [[ "${1:-}" == "--batch" ]]; then
    COUNT=${2:-3}
    echo "Generating $COUNT test recordings..."
    for i in $(seq 1 "$COUNT"); do
        BATCH_PHONE=${PHONE_NUMBERS[$((RANDOM % ${#PHONE_NUMBERS[@]}))]}
        BATCH_NAME="Call_${BATCH_PHONE}_${TIMESTAMP}_${i}.m4a"
        BATCH_FILE="$TMP_DIR/$BATCH_NAME"
        ffmpeg -y -f lavfi -i "sine=frequency=$((300 + RANDOM % 700)):duration=$((3 + RANDOM % 8))" \
            -c:a aac -b:a 64k "$BATCH_FILE" 2>/dev/null
        adb push "$BATCH_FILE" "$WATCH_DIR/$BATCH_NAME"
        echo "  [$i/$COUNT] Pushed $BATCH_NAME"
        sleep 1
    done
    echo "Done. $COUNT recordings pushed."
    exit 0
else
    echo "Generating ${DURATION}s test recording..."
fi

# Generate a test .m4a file with a sine tone
OUTPUT_FILE="$TMP_DIR/$FILE_NAME"
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=$DURATION" \
    -c:a aac -b:a 64k "$OUTPUT_FILE" 2>/dev/null

echo "Pushing $FILE_NAME to emulator..."
adb push "$OUTPUT_FILE" "$WATCH_DIR/$FILE_NAME"

echo ""
echo "Done! File pushed to: $WATCH_DIR/$FILE_NAME"
echo "MindShield should detect this file and begin processing."
