var AssetsCurrentlyEquipped = []
var AssetTypeDict = {}
var AvatarRules = {}
var UserBodyColors = {
    'Head': 1001,
    'Torso': 1001,
    'LeftArm': 1001,
    'RightArm': 1001,
    'LeftLeg': 1001,
    'RightLeg': 1001
}
var UserAvatarScaling = {
    'height': 1,
    'width': 1,
    'head': 1,
    'proportion': 0
}
var rigType = "R6"
var AssetCardTemplate = null
var PageNumber = 0
var SelectedAssetType = 11
var IsThisTheLastPage = false
var PaginationPreviousBtn = null
var PaginationNextBtn = null
var PaginationText = null

var is3DViewEnabled = localStorage.getItem('avatar3DView') === 'false';
var current3DHash = null;

async function GetLimitForAssetType( AssetType ) {
    // Loop through the "wearableAssetTypes" array in avatarrules.json
    for (let i = 0; i < AvatarRules.wearableAssetTypes.length; i++) {
        if (AvatarRules.wearableAssetTypes[i].id == AssetType) {
            return AvatarRules.wearableAssetTypes[i].maxNumber
        }
    }
    return 0
}

async function GetAssetsForType( AssetType, Page = 0 ) {
    var AssetFetchResponse = await fetch('/avatar/getassets?type=' + AssetType + '&page=' + Page)
    if (AssetFetchResponse.status != 200) {
        return []
    }
    var AssetFetchResponseJSON = await AssetFetchResponse.json()
    var Assets = AssetFetchResponseJSON["assets"]
    // Insert the assets into the AssetTypeDict
    for (let i = 0; i < Assets.length; i++) {
        Assets[i].assetType = AssetType
        AssetTypeDict[Assets[i].id] = Assets[i]
    }
    IsThisTheLastPage = AssetFetchResponseJSON["lastPage"]
    return Assets
}


async function toggle3DView() {
    is3DViewEnabled = !is3DViewEnabled;
    localStorage.setItem('avatar3DView', is3DViewEnabled.toString());
    document.getElementById('toggle-3d-btn').innerText = is3DViewEnabled ? '2D' : '3D';
    
    if (is3DViewEnabled) {
        await checkAndRender3DAvatar();
    } else {
        show2DAvatar();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .spinner-container {
            width: 40px;
            height: 40px;
            margin-bottom: 10px;
        }

        .spinner {
            width: 100%;
            height: 100%;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #3498db;
            animation: spin 1s linear infinite;
        }

        .loading-text {
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }

        .error-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .error-indicator span {
            font-size: 24px;
            margin-bottom: 10px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});
function checkAndRender3DAvatar() {
    const avatarImage = document.getElementById('avatar-image');
    const avatarContainer = document.querySelector('.avatar-image-container');
    
    if (!avatarContainer) {
        console.error('Avatar container not found');
        return;
    }
    
    if (avatarImage) {
        avatarImage.style.opacity = 0;
    }
    
    try {
        const initialLoadingIndicator = document.createElement('div');
        initialLoadingIndicator.id = 'initial-3d-loading';
        initialLoadingIndicator.className = 'loading-indicator';
        initialLoadingIndicator.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
            </div>
            <div class="loading-text">Initializing 3D View...</div>
        `;
        initialLoadingIndicator.style.position = 'absolute';
        initialLoadingIndicator.style.top = '50%';
        initialLoadingIndicator.style.left = '50%';
        initialLoadingIndicator.style.transform = 'translate(-50%, -50%)';
        initialLoadingIndicator.style.textAlign = 'center';
        initialLoadingIndicator.style.zIndex = '10';
        avatarContainer.appendChild(initialLoadingIndicator);
        
        fetch('/avatar/3d')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch 3D avatar data');
                return response.json();
            })
            .then(data => {
                const loadingIndicator = document.getElementById('initial-3d-loading');
                if (loadingIndicator) loadingIndicator.remove();
                
                if (data.state === 'Completed' && data.imageUrl) {
                    return fetch(`/cdn_local/${data.imageUrl}`)
                        .then(modelResponse => {
                            if (!modelResponse.ok) throw new Error('Failed to fetch 3D model config');
                            return modelResponse.json();
                        })
                        .then(modelData => {
                            current3DHash = data.imageUrl;
                            render3DAvatar(modelData);
                        });
                } else if (data.state === 'Pending') {
                    pollFor3DAvatar();
                } else {
                    throw new Error('Invalid 3D avatar state');
                }
            })
            .catch(error => {
                console.error('Error in 3D avatar rendering:', error);
                
                const loadingIndicator = document.getElementById('initial-3d-loading');
                if (loadingIndicator) loadingIndicator.remove();
                
                show2DAvatar();
                
                const errorIcon = document.createElement('div');
                errorIcon.className = 'error-indicator';
                errorIcon.innerHTML = '<span class="icon-spot-error-2xl"></span><div>Failed to initialize 3D view</div>';
                errorIcon.style.position = 'absolute';
                errorIcon.style.top = '50%';
                errorIcon.style.left = '50%';
                errorIcon.style.transform = 'translate(-50%, -50%)';
                errorIcon.style.textAlign = 'center';
                errorIcon.style.color = '#ff3333';
                avatarContainer.appendChild(errorIcon);
                
                setTimeout(() => {
                    if (errorIcon && errorIcon.parentNode) {
                        errorIcon.remove();
                    }
                }, 3000);
            });
    } catch (error) {
        console.error('Error in 3D avatar initialization:', error);
        show2DAvatar();
    }
}

function tween(start, end, duration, onUpdate, onComplete) {
    let startTime = Date.now();
    function update() {
        let now = Date.now();
        let progress = Math.min((now - startTime) / duration, 1);
        let value = start + (end - start) * progress;
        onUpdate(value);
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            onComplete();
        }
    }
    update();
}

async function pollFor3DAvatar() {
    const maxAttempts = 30;
    let attempts = 0;
    
    const avatarImage = document.getElementById('avatar-image');
    const avatarContainer = document.querySelector('.avatar-image-container');
    
    if (!avatarContainer) {
        console.error('Avatar container not found');
        return;
    }
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = '3d-avatar-spinner';
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
        <div class="loading-text">Loading 3D Avatar...</div>
    `;
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.zIndex = '10';
    avatarContainer.appendChild(loadingIndicator);
    
    tween(1, 0, 300, 
        (value) => { 
            if (avatarImage) avatarImage.style.opacity = value; 
        },
        () => {} 
    );
    
    const poll = async () => {
        attempts++;
        try {
            const response = await fetch('/avatar/3d');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            if (data.state === 'Completed' && data.imageUrl) {
                const modelResponse = await fetch(`/cdn_local/${data.imageUrl}`);
                if (!modelResponse.ok) throw new Error('Failed to fetch model config');
                
                const modelData = await modelResponse.json();
                current3DHash = data.imageUrl;
                
                const loadingSpinner = document.getElementById('3d-avatar-spinner');
                if (loadingSpinner) loadingSpinner.remove();
                
                render3DAvatar(modelData);
            } else if (data.state === 'Pending' && attempts < maxAttempts) {
                setTimeout(poll, 500);
            } else {
                throw new Error('Avatar rendering failed or timed out');
            }
        } catch (error) {
            console.error('Error in 3D avatar polling:', error);
            
            const loadingSpinner = document.getElementById('3d-avatar-spinner');
            if (loadingSpinner) loadingSpinner.remove();
            
            show2DAvatar();
            
            if (attempts >= maxAttempts) {
                const currentAvatarContainer = document.querySelector('.avatar-image-container');
                if (currentAvatarContainer) {
                    var errorIcon = document.createElement('div');
                    errorIcon.className = 'error-indicator';
                    errorIcon.innerHTML = '<span class="icon-spot-error-2xl"></span><div>Failed to load 3D avatar</div>';
                    errorIcon.style.position = 'absolute';
                    errorIcon.style.top = '50%';
                    errorIcon.style.left = '50%';
                    errorIcon.style.transform = 'translate(-50%, -50%)';
                    errorIcon.style.textAlign = 'center';
                    errorIcon.style.color = '#ff3333';
                    currentAvatarContainer.appendChild(errorIcon);
                    
                    setTimeout(() => {
                        if (errorIcon && errorIcon.parentNode) {
                            errorIcon.remove();
                        }
                    }, 3000);
                }
            }
        }
    };
    
    await poll();
}

async function request3DAvatar() {
    const avatarContainer = document.querySelector('.avatar-image-container');
    if (!avatarContainer) {
        console.error('Avatar container not found');
        return;
    }
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'request-3d-loading';
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
        <div class="loading-text">Requesting 3D Avatar...</div>
    `;
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.zIndex = '10';
    avatarContainer.appendChild(loadingIndicator);
    
    try {
        setTimeout(() => {
            const initialLoading = document.getElementById('request-3d-loading');
            if (initialLoading) initialLoading.remove();
            pollFor3DAvatar();
        }, 500);
    } catch (error) {
        console.error('Error requesting 3D avatar:', error);
        const loadingIndicator = document.getElementById('request-3d-loading');
        if (loadingIndicator) loadingIndicator.remove();
        show2DAvatar();
    }
}
function render3DAvatar(modelData) {
    const avatarContainer = document.querySelector('.avatar-image-container');
    
    if (!avatarContainer) {
        console.error('Avatar container not found for 3D rendering');
        return;
    }
    
    const existingCanvas = avatarContainer.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();
    
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.zIndex = '1';
    avatarContainer.appendChild(canvas);
    
    const scene = new THREE.Scene();
    scene.background = null;
    
    const camera = new THREE.PerspectiveCamera(
        45, 
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);
    
    avatarGroup.position.set(0, 0, 0);
    
    addLightsToScene(scene, camera, false);
    
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05; 
    controls.screenSpacePanning = false;
    controls.minDistance = 0;  
    controls.maxDistance = 15;  
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3.0; 
    
    const mtlLoader = new THREE.MTLLoader();
    const objLoader = new THREE.OBJLoader();
    const textureLoader = new THREE.TextureLoader();

    const modelLoadingIndicator = document.createElement('div');
    modelLoadingIndicator.id = 'model-loading-indicator';
    modelLoadingIndicator.className = 'loading-indicator';
    modelLoadingIndicator.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
        <div class="loading-text">Loading Model...</div>
    `;
    modelLoadingIndicator.style.position = 'absolute';
    modelLoadingIndicator.style.top = '50%';
    modelLoadingIndicator.style.left = '50%';
    modelLoadingIndicator.style.transform = 'translate(-50%, -50%)';
    modelLoadingIndicator.style.textAlign = 'center';
    modelLoadingIndicator.style.zIndex = '10';
    avatarContainer.appendChild(modelLoadingIndicator);

    fetch(`/cdn_local/${modelData.mtl}`)
        .then(response => response.text())
        .then(mtlContent => {
            const cleanMTLContent = mtlContent
                .replace(/^map_Ka\s+.*$/gm, '')
                .replace(/^map_Kd\s+.*$/gm, '')
                .replace(/^map_d\s+.*$/gm, '')
                .replace(/^\s*[\r\n]/gm, '');
            
            const materials = mtlLoader.parse(cleanMTLContent);
            materials.preload();

            for (const key in materials.materials) {
                if (materials.materials.hasOwnProperty(key)) {
                    const material = materials.materials[key];
                    material.transparent = false;
                    material.opacity = 1.0;
                    material.side = THREE.DoubleSide;
                    material.alphaTest = 0;
                    material.depthWrite = true;
                    material.depthTest = true;
                    
                    material.map = null;
                    material.mapKa = null;
                    material.mapKd = null;
                    material.mapKs = null;
                    material.mapD = null;
                    
                    material.color = material.color || new THREE.Color(0xffffff);
                    material.specular = material.specular || new THREE.Color(0x111111);
                    material.shininess = material.shininess || 30;
                }
            }

            objLoader.setMaterials(materials);
            
            objLoader.load(`/cdn_local/${modelData.obj}`, (object) => {
                const loadingIndicator = document.getElementById('model-loading-indicator');
                if (loadingIndicator) loadingIndicator.remove();
                
                avatarGroup.add(object);
                
                const bbox = new THREE.Box3().setFromObject(object);
                const center = new THREE.Vector3();
                bbox.getCenter(center);
                object.position.sub(center);
                
                const size = bbox.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                object.scale.set(scale, scale, scale);
                
                const newBbox = new THREE.Box3().setFromObject(object);
                const newCenter = new THREE.Vector3();
                newBbox.getCenter(newCenter);
                object.position.sub(newCenter);
                
                camera.position.z = -3;
                camera.lookAt(avatarGroup.position);
                
                if (modelData.textures && modelData.textures.length > 0) {
                    textureLoader.load(`/cdn_local/${modelData.textures[0]}`, (texture) => {
                        object.traverse((child) => {
                            if (child.isMesh) {
                                child.material.map = texture;
                                child.material.needsUpdate = true;
                            }
                        });
                    });
                }
                
                function animate() {
                    requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                }
                
                animate();
                
                function handleResize() {
                    const width = canvas.clientWidth;
                    const height = canvas.clientHeight;
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    renderer.setSize(width, height, false);
                }
                
                window.addEventListener('resize', handleResize);
                setTimeout(handleResize, 0);
                
                canvas.addEventListener('dblclick', () => controls.reset());
                controls.addEventListener('start', () => controls.autoRotate = false);
                controls.addEventListener('end', () => {
                    setTimeout(() => controls.autoRotate = true, 1000);
                });
                
            }, 
            (xhr) => {
                const loadingText = document.querySelector('#model-loading-indicator .loading-text');
                if (loadingText) {
                    const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
                    loadingText.textContent = `Loading Model... ${percentComplete}%`;
                }
            }, 
            (error) => {
                console.error('Error loading OBJ model:', error);
                const loadingIndicator = document.getElementById('model-loading-indicator');
                if (loadingIndicator) loadingIndicator.remove();
                show2DAvatar();
                
                const currentAvatarContainer = document.querySelector('.avatar-image-container');
                if (currentAvatarContainer) {
                    var errorIcon = document.createElement('div');
                    errorIcon.className = 'error-indicator';
                    errorIcon.innerHTML = '<span class="icon-spot-error-2xl"></span><div>Failed to load 3D model</div>';
                    errorIcon.style.position = 'absolute';
                    errorIcon.style.top = '50%';
                    errorIcon.style.left = '50%';
                    errorIcon.style.transform = 'translate(-50%, -50%)';
                    errorIcon.style.textAlign = 'center';
                    errorIcon.style.color = '#ff3333';
                    currentAvatarContainer.appendChild(errorIcon);
                    
                    setTimeout(() => {
                        if (errorIcon && errorIcon.parentNode) {
                            errorIcon.remove();
                        }
                    }, 3000);
                }
            });
            
        }, (error) => {
            console.error('Error loading MTL file:', error);
            const loadingIndicator = document.getElementById('model-loading-indicator');
            if (loadingIndicator) loadingIndicator.remove();
            show2DAvatar();
            
            const currentAvatarContainer = document.querySelector('.avatar-image-container');
            if (currentAvatarContainer) {
                var errorIcon = document.createElement('div');
                errorIcon.className = 'error-indicator';
                errorIcon.innerHTML = '<span class="icon-spot-error-2xl"></span><div>Failed to load material</div>';
                errorIcon.style.position = 'absolute';
                errorIcon.style.top = '50%';
                errorIcon.style.left = '50%';
                errorIcon.style.transform = 'translate(-50%, -50%)';
                errorIcon.style.textAlign = 'center';
                errorIcon.style.color = '#ff3333';
                currentAvatarContainer.appendChild(errorIcon);
                
                setTimeout(() => {
                    if (errorIcon && errorIcon.parentNode) {
                        errorIcon.remove();
                    }
                }, 3000);
            }
        });
}

function addLightsToScene(scene, camera, useDynamicLighting) {
    if (useDynamicLighting) {
        const ambient = new THREE.AmbientLight(0x444444);
        camera.add(ambient);
        
        const keylight = new THREE.DirectionalLight(0xd4d4d4);
        keylight.target = camera;
        keylight.position.set(-7.5, 0.5, -6.0).normalize();
        camera.add(keylight);
        
        const fillLight = new THREE.DirectionalLight(0xacacac);
        fillLight.target = camera;
        fillLight.position.set(20.0, 4.0, -0).normalize();
        camera.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0xacacac);
        rimLight.target = camera;
        rimLight.position.set(0, 1, 1).normalize();
        camera.add(rimLight);
    } else {
        const ambient = new THREE.AmbientLight(0x878780);
        scene.add(ambient);
        
        const sunLight = new THREE.DirectionalLight(0xacacac);
        sunLight.position.set(-0.671597898, 0.671597898, 0.312909544).normalize();
        scene.add(sunLight);
        
        const backLight = new THREE.DirectionalLight(0x444444);
        const backLightPos = new THREE.Vector3()
            .copy(sunLight.position)
            .negate()
            .normalize();
        backLight.position.set(backLightPos);
        scene.add(backLight);
    }
}
function show2DAvatar() {
    const avatarImage = document.getElementById('avatar-image');
    const avatarContainer = document.querySelector('.avatar-image-container');
    
    if (!avatarContainer) {
        console.error('Avatar container not found');
        return;
    }
    
    const existingCanvas = avatarContainer.querySelector('canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    if (avatarImage) {
        avatarImage.style.opacity = 1;
    }
}


async function RedrawAvatar() {
    if (is3DViewEnabled) {
        await request3DAvatar();
    } else {
        var RedrawResponse = await fetch('/avatar/forceredraw', {
            method: 'POST'
        });
        if (RedrawResponse.status == 200) {
            WaitForRenderReady();
        } else if (RedrawResponse.status == 400) {
            alert("Something went wrong!");
        } else if (RedrawResponse.status == 429) {
            alert("Slow down! You recently asked for a redraw!");
        } else {
            alert("Something went wrong!");
        }
    }
}


async function WaitForRenderReady() {
    var RenderWaitingText = document.getElementById('render-waiting-text')
    RenderWaitingText.style.display = 'block'
    while (true) {
        var RenderReadyResponse = await fetch('/avatar/isthumbnailready')
        if (RenderReadyResponse.status == 200) {
            var RenderReadyResponseJSON = await RenderReadyResponse.json()
            if (RenderReadyResponseJSON["ready"]) {
                break
            }
        }
        await new Promise(r => setTimeout(r, 500));
    }
    RenderWaitingText.style.display = 'none'
    var AvatarImage = document.getElementById('avatar-image')
    var AvatarSource = AvatarImage.src // Unmodified src "/Thumbs/Avatar.ashx?x=420&y=420&userId=1"
    if (AvatarSource.includes('&refresh=')) {
        AvatarSource = AvatarSource.substring(0, AvatarSource.indexOf('&refresh='))
    }
    AvatarImage.src = AvatarSource + '&refresh=' + Math.random()
}

async function UpdateAvatar() {
    var SaveChangesButton = document.getElementById('savechanges-btn')
    SaveChangesButton.style.display = 'none'
    var CurrentlyEquippedArray = []
    for (let i = 0; i < AssetsCurrentlyEquipped.length; i++) {
        CurrentlyEquippedArray.push(AssetTypeDict[AssetsCurrentlyEquipped[i]].id)
    }
    var UpdateAvatarResponse = await fetch('/avatar/setavatar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'bodyColors': [UserBodyColors.Head, UserBodyColors.Torso, UserBodyColors.LeftArm, UserBodyColors.RightArm, UserBodyColors.LeftLeg, UserBodyColors.RightLeg],
            "assets": CurrentlyEquippedArray,
            "rigType": rigType,
            "scales": UserAvatarScaling
        })
    })
    if (UpdateAvatarResponse.status == 200) {
        WaitForRenderReady()
    } else if (UpdateAvatarResponse.status == 400) {
        alert('Something went wrong!')
    } else if (UpdateAvatarResponse.status == 429) {
        alert('Slow down! You are changing your avatar too fast!')
        SaveChangesButton.style.display = 'block'
    } else {
        alert('Something went wrong!')
    }
}

async function ConvertBodyColortoHex( bodycolor ) {
    for (let i = 0; i < AvatarRules.bodyColorsPalette.length; i++) {
        if (AvatarRules.bodyColorsPalette[i].brickColorId == bodycolor) {
            return AvatarRules.bodyColorsPalette[i].hexColor
        }
    }
    return '#FFFFFF'
}

async function UpdateAssetCards( assetId ) {
    var AssetCards = document.getElementsByClassName(`asset-card-${assetId}`)
    var IsAssetEquipped = AssetsCurrentlyEquipped.includes(assetId)
    for (let i = 0; i < AssetCards.length; i++) {
        var ToggleWearButton = AssetCards[i].getElementsByClassName('asset-card-button')[0]
        if (IsAssetEquipped) {
            ToggleWearButton.innerHTML = 'Remove'
        } else {
            ToggleWearButton.innerHTML = 'Wear'
            if (AssetCards[i].getAttribute("data-isundercurrentwearing") == "true") {
                AssetCards[i].remove()
            }
        }
    }
}

async function WearAsset( assetId ) {
    if (AssetsCurrentlyEquipped.includes(assetId)) {
        return
    }
    assetType = AssetTypeDict[assetId].assetType
    var LimitForAssetType = await GetLimitForAssetType(assetType)
    var CountForAssetType = 0
    for (let i = 0; i < AssetsCurrentlyEquipped.length; i++) {
        if (AssetTypeDict[AssetsCurrentlyEquipped[i]].assetType == assetType) {
            CountForAssetType++
        }
    }
    if (CountForAssetType >= LimitForAssetType) {
        for (let i = 0; i < AssetsCurrentlyEquipped.length; i++) {
            if (AssetTypeDict[AssetsCurrentlyEquipped[i]].assetType == assetType) {
                var AssetId = AssetsCurrentlyEquipped[i]
                AssetsCurrentlyEquipped.splice(i, 1)
                UpdateAssetCards(AssetId)
                break
            }
        }
    }
    if (LimitForAssetType > 0) {
        AssetsCurrentlyEquipped.push(assetId)
        var CurrentlyWearingCardHolder = document.getElementById('currentlywearing-card-holder')
        var NewAssetCard = await CreateNewAssetCard(assetId, AssetTypeDict[assetId].name)
        CurrentlyWearingCardHolder.appendChild(NewAssetCard)
        NewAssetCard.setAttribute("data-isundercurrentwearing", "true")
    }
    UpdateAssetCards(assetId)
    document.getElementById('savechanges-btn').style.display = 'block'
}

async function RemoveAsset( assetId ) {
    for (let i = 0; i < AssetsCurrentlyEquipped.length; i++) {
        if (AssetsCurrentlyEquipped[i] == assetId) {
            AssetsCurrentlyEquipped.splice(i, 1)
            break
        }
    }
    UpdateAssetCards(assetId)
    document.getElementById('savechanges-btn').style.display = 'block'
}

async function CreateNewAssetCard( AssetId, Name ) {
    var NewAssetCard = AssetCardTemplate.cloneNode(true)
    NewAssetCard.setAttribute("class", NewAssetCard.getAttribute("class").replace("template", AssetId))
    NewAssetCard.style.display = 'block'
    var AssetImage = NewAssetCard.getElementsByClassName('asset-card-img')[0]
    var AssetName = NewAssetCard.getElementsByClassName('asset-card-assetname')[0]
    var AssetToggleButton = NewAssetCard.getElementsByClassName('asset-card-button')[0]
    AssetImage.src = `/Thumbs/Asset.ashx?x=150&y=150&assetId=${AssetId}`
    AssetName.innerText = Name
    AssetName.href = `/catalog/${AssetId}/`
    
    //var AssetsCardHolder = document.getElementById('assets-card-holder')
    //AssetsCardHolder.appendChild(NewAssetCard)

    if (AssetsCurrentlyEquipped.includes(AssetId)) {
        AssetToggleButton.innerText = 'Remove'
    }
    if ( AssetTypeDict[AssetId].moderation_status == 0 ) {
        AssetToggleButton.addEventListener('click', async () => {
            if (AssetToggleButton.innerText == 'Wear') {
                AssetToggleButton.innerText = 'Remove'
                WearAsset(AssetId)
            } else if (AssetToggleButton.innerText == 'Remove') {
                AssetToggleButton.innerText = 'Wear'
                RemoveAsset(AssetId)
            }
        })
    } else {
        AssetToggleButton.disabled = true
        if ( AssetTypeDict[AssetId].moderation_status == 1 ) {
            AssetToggleButton.innerText = 'Pending'
        } else if ( AssetTypeDict[AssetId].moderation_status == 2 ) {
            AssetToggleButton.innerText = 'Deleted'
        }
    }

    return NewAssetCard
}

async function LoadPageForAsset( AssetType ) {
    var AssetsArray = await GetAssetsForType(AssetType, PageNumber)
    var AssetsCardHolder = document.getElementById('assets-card-holder')
    AssetsCardHolder.innerHTML = ''
    for (let i = 0; i < AssetsArray.length; i++) {
        var Asset = AssetsArray[i]
        var AssetCard = await CreateNewAssetCard(Asset.id, Asset.name)
        AssetsCardHolder.appendChild(AssetCard)
    }

    if (PageNumber > 0) {
        PaginationPreviousBtn.disabled = false
    } else {
        PaginationPreviousBtn.disabled = true
    }
    if (!IsThisTheLastPage) {
        PaginationNextBtn.disabled = false
    } else {
        PaginationNextBtn.disabled = true
    }
    if (AssetsArray.length == 0) {
        AssetsCardHolder.innerHTML = '<p style="text-align: center;" class="mt-3">No items found</p>'
    }
}

var ColorPickerSelectedBodyPart = -1

document.addEventListener('DOMContentLoaded', async () => {
    const ResponseAvatarRules = await fetch('/static/avatarrules.json?version=2')
    AvatarRules = await ResponseAvatarRules.json()
    AssetCardTemplate = document.getElementsByClassName('asset-card-template')[0]
    PaginationNextBtn = document.getElementById('pagination-next-btn')
    PaginationPreviousBtn = document.getElementById('pagination-back-btn')
    PaginationText = document.getElementById('pagination-page-number')
    const ResponseUserAvatar = await fetch('/avatar/getavatar')
    const UserAvatar = await ResponseUserAvatar.json() // This should respond with {"bodyColors": [headColor, torsoColor, leftArmColor, rightArmColor, leftLegColor, rightLegColor], "currentlyWearing": [assetId]}
    var CurrentlyWearingCardHolder = document.getElementById('currentlywearing-card-holder')
    for (let i = 0; i < UserAvatar.currentlyWearing.length; i++) {
        var Asset = UserAvatar.currentlyWearing[i]
        AssetTypeDict[Asset.id] = {"id": Asset.id, "assetType": Asset.type, "name": Asset.name, "moderation_status": Asset.moderation_status}
        AssetsCurrentlyEquipped.push(Asset.id)
        var AssetCard = await CreateNewAssetCard(Asset.id, Asset.name)
        CurrentlyWearingCardHolder.appendChild(AssetCard)
        AssetCard.setAttribute("data-isundercurrentwearing", "true")
    }

    UserBodyColors.Head = UserAvatar.bodyColors[0]
    UserBodyColors.Torso = UserAvatar.bodyColors[1]
    UserBodyColors.LeftArm = UserAvatar.bodyColors[2]
    UserBodyColors.RightArm = UserAvatar.bodyColors[3]
    UserBodyColors.LeftLeg = UserAvatar.bodyColors[4]
    UserBodyColors.RightLeg = UserAvatar.bodyColors[5]
    
    const SaveChangesButton = document.getElementById('savechanges-btn')


    document.getElementById('toggle-3d-btn').addEventListener('click', toggle3DView);

    if (is3DViewEnabled) {
        document.getElementById('toggle-3d-btn').innerText = '2D';
        checkAndRender3DAvatar();
    } else {
        document.getElementById('toggle-3d-btn').innerText = '3D';
    }


    const SelectTabInput = document.getElementById('select-tab-input')
    const EquipAssetsTab = document.getElementById('equip-assets-tab')
    const AvatarScalingTab = document.getElementById('avatar-scaling-tab')

    SelectTabInput.addEventListener('change', () => {
        var selectedTabIndex = Number(SelectTabInput.options[SelectTabInput.selectedIndex].getAttribute('data-tab'))
        if (selectedTabIndex == 1) {
            EquipAssetsTab.style.display = 'block'
            AvatarScalingTab.style.display = 'none'
        } else if (selectedTabIndex == 2) {
            EquipAssetsTab.style.display = 'none'
            AvatarScalingTab.style.display = 'block'
        }
    })
// haha i touched it! Fuck ou!!!!
    const HeadColor = document.getElementById('head-bodycolor')
    const TorsoColor = document.getElementById('torso-bodycolor')
    const LeftArmColor = document.getElementById('leftarm-bodycolor')
    const RightArmColor = document.getElementById('rightarm-bodycolor')
    const LeftLegColor = document.getElementById('leftleg-bodycolor')
    const RightLegColor = document.getElementById('rightleg-bodycolor')

    HeadColor.style.backgroundColor = await ConvertBodyColortoHex(UserBodyColors.Head)
    TorsoColor.style.backgroundColor = await ConvertBodyColortoHex(UserBodyColors.Torso)
    LeftArmColor.style.backgroundColor = await ConvertBodyColortoHex(UserBodyColors.LeftArm)
    RightArmColor.style.backgroundColor = await ConvertBodyColortoHex(UserBodyColors.RightArm)
    LeftLegColor.style.backgroundColor = await ConvertBodyColortoHex(UserBodyColors.LeftLeg)
    RightLegColor.style.backgroundColor = await ConvertBodyColortoHex(UserBodyColors.RightLeg)

    HeadColor.addEventListener('click', () => {
        ColorPickerSelectedBodyPart = 0
        ColorPickerOverlay.style.display = 'block'
    })
    TorsoColor.addEventListener('click', () => {
        ColorPickerSelectedBodyPart = 1
        ColorPickerOverlay.style.display = 'block'
    })
    LeftArmColor.addEventListener('click', async () => {
        await new Promise(r => setTimeout(r, 100)); // This fixes an issue where the torso and left arm would be selected at the same time
        ColorPickerSelectedBodyPart = 2
        ColorPickerOverlay.style.display = 'block'
    })
    RightArmColor.addEventListener('click', async () => {
        await new Promise(r => setTimeout(r, 100));
        ColorPickerSelectedBodyPart = 3
        ColorPickerOverlay.style.display = 'block'
    })
    LeftLegColor.addEventListener('click', () => {
        ColorPickerSelectedBodyPart = 4
        ColorPickerOverlay.style.display = 'block'
    })
    RightLegColor.addEventListener('click', () => {
        ColorPickerSelectedBodyPart = 5
        ColorPickerOverlay.style.display = 'block'
    })

    const ColorPickerOverlay = document.getElementById('color-picker-overlay')
    const ColorPickerContent = document.getElementById('color-picker-content')
    const ColorPickerClose = document.getElementById('color-picker-close')

    ColorPickerClose.addEventListener('click', () => {
        ColorPickerOverlay.style.display = 'none'
    })
    // We need to add each BrickColor to the color picker content
    for (let i = 0; i < AvatarRules.bodyColorsPalette.length; i++) {
        const ColorPickerItem = document.createElement('p')
        ColorPickerItem.classList.add('color-picker-item')
        ColorPickerItem.setAttribute("title", AvatarRules.bodyColorsPalette[i].name)
        ColorPickerItem.setAttribute("data-brickcolorid", AvatarRules.bodyColorsPalette[i].brickColorId)
        ColorPickerItem.style.backgroundColor = AvatarRules.bodyColorsPalette[i].hexColor
        ColorPickerContent.appendChild(ColorPickerItem)
    }
    const ColorPickerItems = document.getElementsByClassName('color-picker-item')
    for (let i = 0; i < ColorPickerItems.length; i++) {
        ColorPickerItems[i].addEventListener('click', async () => {
            if (ColorPickerSelectedBodyPart > -1) {
                var SelectedBrickColor = ColorPickerItems[i].getAttribute('data-brickcolorid')
                if (ColorPickerSelectedBodyPart == 0) {
                    HeadColor.style.backgroundColor = await ConvertBodyColortoHex(Number(SelectedBrickColor))
                    UserBodyColors.Head = Number(SelectedBrickColor)
                } else if (ColorPickerSelectedBodyPart == 1) {
                    TorsoColor.style.backgroundColor = await ConvertBodyColortoHex(Number(SelectedBrickColor))
                    UserBodyColors.Torso = Number(SelectedBrickColor)
                } else if (ColorPickerSelectedBodyPart == 2) {
                    LeftArmColor.style.backgroundColor = await ConvertBodyColortoHex(Number(SelectedBrickColor))
                    UserBodyColors.LeftArm = Number(SelectedBrickColor)
                } else if (ColorPickerSelectedBodyPart == 3) {
                    RightArmColor.style.backgroundColor = await ConvertBodyColortoHex(Number(SelectedBrickColor))
                    UserBodyColors.RightArm = Number(SelectedBrickColor)
                } else if (ColorPickerSelectedBodyPart == 4) {
                    LeftLegColor.style.backgroundColor = await ConvertBodyColortoHex(Number(SelectedBrickColor))
                    UserBodyColors.LeftLeg = Number(SelectedBrickColor)
                } else if (ColorPickerSelectedBodyPart == 5) {
                    RightLegColor.style.backgroundColor = await ConvertBodyColortoHex(Number(SelectedBrickColor))
                    UserBodyColors.RightLeg = Number(SelectedBrickColor)
                }
            }
            SaveChangesButton.style.display = 'block'
            ColorPickerSelectedBodyPart = -1
            ColorPickerOverlay.style.display = 'none'
        })
    }

    PaginationNextBtn.addEventListener('click', () => {
        if (PaginationNextBtn.disabled){
            return
        }
        PaginationPreviousBtn.disabled = true
        PaginationNextBtn.disabled = true
        if (!IsThisTheLastPage) {
            PageNumber += 1
            LoadPageForAsset(SelectedAssetType)
        }
        PaginationText.innerText = `Page ${PageNumber+1}`
    })
    PaginationPreviousBtn.addEventListener('click', () => {
        if (PaginationPreviousBtn.disabled){
            return
        }
        PaginationPreviousBtn.disabled = true
        PaginationNextBtn.disabled = true
        if (PageNumber > 0) {
            PageNumber -= 1
            LoadPageForAsset(SelectedAssetType)
        }
        PaginationText.innerText = `Page ${PageNumber+1}`
    })
    var SelectAssetTypeElement = document.getElementById('select-asset-type')
    SelectAssetTypeElement.addEventListener('change', () => {
        // The option element has a data-assettype attribute which we can use to get the asset type
        SelectedAssetType = Number(SelectAssetTypeElement.options[SelectAssetTypeElement.selectedIndex].getAttribute('data-type'))
        PageNumber = 0
        PaginationPreviousBtn.disabled = true
        PaginationNextBtn.disabled = true
        PaginationText.innerText = `Page ${PageNumber+1}`
        LoadPageForAsset(SelectedAssetType)
    })

    const changeRigTypeBtn = document.getElementById('change-rigtype-btn')
    if ( UserAvatar.rigType == "R6" ) {
        changeRigTypeBtn.innerText = "R15"
    } else {
        changeRigTypeBtn.innerText = "R6"
    }
    rigType = UserAvatar.rigType
    changeRigTypeBtn.addEventListener('click', async () => {
        changeRigTypeBtn.innerText = rigType
        if ( rigType == "R6" ) {
            rigType = "R15"
        } else {
            rigType = "R6"
        }
        SaveChangesButton.style.display = 'block'
    })

    async function HandleScaleSlider( scaleName ) {
        UserAvatarScaling[scaleName] = UserAvatar.scales[scaleName]
        const sliderParent = document.getElementById(`${scaleName}-scale-group`)

        const SliderInput = sliderParent.getElementsByClassName("scaling-slider")[0]
        const SliderValueText = sliderParent.getElementsByClassName("scaling-value")[0]
        const ScaleRules = AvatarRules.scales[scaleName]

        SliderInput.min = ScaleRules.min * 100
        SliderInput.max = ScaleRules.max * 100
        SliderInput.step = ScaleRules.step * 100
        SliderInput.value = UserAvatar.scales[scaleName] * 100

        SliderValueText.innerText = `${UserAvatar.scales[scaleName] * 100}%`

        SliderInput.addEventListener('input', () => {
            SliderValueText.innerText = `${SliderInput.value}%`
            SaveChangesButton.style.display = 'block'
            UserAvatarScaling[scaleName] = SliderInput.value / 100
        })
    }

    await HandleScaleSlider( "height" )
    await HandleScaleSlider( "width" )
    await HandleScaleSlider( "head" )
    await HandleScaleSlider( "proportion" )

    LoadPageForAsset(11) // Default: Shirt
})