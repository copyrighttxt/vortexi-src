#!/bin/bash
# Even at your darkest times. Remember this is still lots to come. - Kuromi
cat <<'EOF'
 __     __                       __                          __ 
/  |   /  |                     /  |                        /  |
$$ |   $$ | ______    ______   _$$ |_     ______   __    __ $$/ 
$$ |   $$ |/      \  /      \ / $$   |   /      \ /  \  /  |/  |
$$  \ /$$//$$$$$$  |/$$$$$$  |$$$$$$/   /$$$$$$  |$$  \/$$/ $$ |
 $$  /$$/ $$ |  $$ |$$ |  $$/   $$ | __ $$    $$ | $$  $$<  $$ |
  $$ $$/  $$ \__$$ |$$ |        $$ |/  |$$$$$$$$/  /$$$$  \ $$ |
   $$$/   $$    $$/ $$ |        $$  $$/ $$       |/$$/ $$  |$$ |
    $/     $$$$$$/  $$/          $$$$/   $$$$$$$/ $$/   $$/ $$/ 


EOF
echo "BUILD_HASH = \"$(python3 -c 'import uuid, hashlib; print(hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:8])')\"" > app/build_version.py
echo "Version - $(grep -oP '(?<=BUILD_HASH = ")[a-f0-9]+' app/build_version.py) (prod)"
echo "Running on unknownnode.vortexi.cc @ $(date)"
gunicorn -b 0.0.0.0:3003 --preload --workers=8 --threads=20 "app:create_app()"