import {
    Scene,
    PerspectiveCamera,
    PMREMGenerator,
    Group,
    Clock,
    AnimationMixer,
    WebGLRenderer,
    sRGBEncoding,
    UnsignedByteType,
    REVISION,
    TextureLoader,
    BufferGeometry,
    PointsMaterial,
    AdditiveBlending,
    Float32BufferAttribute,
    Points,
    Audio,
    AudioLoader,
    AudioListener
} from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import worldUrl from "../assets/model/world.gltf?url";
import deerUrl from "../assets/model/deer.glb?url";
import carUrl from "../assets/model/car.gltf?url";
import snowflake0 from "../assets/snowflake0.png";
import snowflake1 from "../assets/snowflake1.png";
import snowflake2 from "../assets/snowflake2.png";
import snowflake3 from "../assets/snowflake3.png";
import snowflake4 from "../assets/snowflake4.png";
import HDR_FILE from "../assets/venice_sunset_1k.hdr?url";
import { GlassFree3dCamera } from "./GlassFree3dCamera";

const MUSIC_URL = "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Simon_Panrucker/Happy_Christmas_You_Guys/Simon_Panrucker_-_01_-_Snowflakes_Falling_Down.mp3"
const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`;
const DRACO_Loader = new DRACOLoader().setDecoderPath(`${THREE_PATH}/examples/js/libs/draco/gltf/`)

interface ModelInfo {
    name: string,
    url: string,
    pos: [number, number, number],
    rot: [number, number, number],
    scale: number
}

const MODELS: ModelInfo[] = [
    {
        name: 'world',
        url: worldUrl,
        pos: [0, 0, 0],
        rot: [0, -Math.PI / 2, 0],
        scale: 2,
    },
    {
        name: 'deer',
        url: deerUrl,
        pos: [-3, 0.02, -4],
        rot: [0, Math.PI / 4 * 3, 0],
        scale: 0.015,
    },
    {
        name: 'car',
        url: carUrl,
        pos: [8.5, 0.2, 7],
        rot: [0, -Math.PI / 4 * 3, 0],
        scale: 0.003,
    }
]

const SNOWFLAKES = [snowflake0, snowflake1, snowflake2, snowflake3, snowflake4]

export class View {
    private scene: Scene;
    public activeCamera: GlassFree3dCamera | PerspectiveCamera;
    private pCamera: PerspectiveCamera;
    private gCamera: GlassFree3dCamera;
    private renderer: WebGLRenderer;
    private pmremGenerator: PMREMGenerator;
    private loader: GLTFLoader;
    private controls: OrbitControls;
    private models: Group;
    private mixers: AnimationMixer[]
    private clock: Clock;
    private isAutoRotate: boolean = true;
    private particlesGroup: Points[] = [];
    private audio: Audio;
    private isOpen: boolean = false;
    private isMusicLoad: boolean = false;

    constructor(private el: HTMLDivElement, loadCallback?: () => void, musicLoadCallback?: () => void) {
        const { clientHeight: height, clientWidth: width } = this.el;
        const aspect = width / height;
        const dis = width / 10;

        // Tools
        this.models = new Group();
        this.mixers = [];
        this.clock = new Clock();

        // Scene
        this.scene = new Scene();

        // Cameras
        this.pCamera = new PerspectiveCamera(75, aspect, 1, 1000);
        this.pCamera.position.set(0, dis / 5, dis * 1.2);
        this.pCamera.name = 'pCamera';

        this.gCamera = new GlassFree3dCamera(0, 0, dis * 1.5, dis, dis / aspect);
        this.gCamera.name = 'gCamera';

        this.activeCamera = this.pCamera;

        // Renderer
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height)
        this.renderer.outputEncoding = sRGBEncoding;
        this.el.appendChild(this.renderer.domElement);

        // Loader
        this.loader = new GLTFLoader().setDRACOLoader(DRACO_Loader);
        Promise.all(MODELS.map(m => this.load(m))).then(() => {
            loadCallback?.();
        })
        // MODELS.forEach(m => this.load(m));

        const modelsScale = 1.5;
        this.models.scale.set(modelsScale, modelsScale, modelsScale)
        this.scene.add(this.models);

        // Controls
        this.controls = new OrbitControls(this.pCamera, this.renderer.domElement);
        this.controls.maxPolarAngle = Math.PI * 0.5;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 60;
        this.controls.enablePan = false;

        // Audio
        const listener = new AudioListener();
        this.audio = new Audio(listener);
        this.initMusic().then(() => {
            musicLoadCallback?.();
        });

        // Animate
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize, false);

        // Set Scene Environment
        this.pmremGenerator = new PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
        this.setEnvironment().then(({ envMap }) => {
            this.scene.environment = envMap
        });

        this.initBackground();
    }

    private async initMusic() {
        const loader = new AudioLoader();
        const musicBuf = await loader.loadAsync(MUSIC_URL);
        this.audio.setBuffer(musicBuf);
        this.isMusicLoad = true;
        if (this.isOpen) this.audio.play();
    }

    private initBackground() {
        for (const snowflake of SNOWFLAKES) {
            const geometry = new BufferGeometry();
            const texture = new TextureLoader().load(snowflake);
            const verticesAttr: number[] = [];
            const vertices: number[] = []
            const range = 200;
            const count = 100;
            for (let i = 0; i < count; i++) {
                const x = Math.random() * range - range / 2;
                const y = Math.random() * range * 1.5;
                const z = Math.random() * range - range / 2;
                const velocityX = (Math.random() - 0.5) / 3;
                const velocityY = 0.1 + Math.random() / 3;

                verticesAttr.push(x, y, z, velocityX, velocityY);
                vertices.push(x, y, z);
            }

            geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('verticesAttr', new Float32BufferAttribute(verticesAttr, 5));

            const materials = new PointsMaterial({
                size: 1.5,
                transparent: true,
                opacity: 0.8,
                map: texture,
                blending: AdditiveBlending,
                sizeAttenuation: true,
                depthTest: false
            });

            this.particlesGroup.push(new Points(geometry, materials))
        }


        this.scene.add(...this.particlesGroup);
    }

    private updateBackground() {
        for (const particles of this.particlesGroup) {
            if (!particles?.geometry?.attributes?.verticesAttr) continue;

            const verticesAttr = particles.geometry.attributes.verticesAttr;

            const newVerticesAttr: number[] = [];
            const newVertices: number[] = []
            for (var i = 0; i < verticesAttr.array.length; i += 5) {
                const x = verticesAttr.array[i];
                const y = verticesAttr.array[i + 1];
                const z = verticesAttr.array[i + 2];
                const velocityX = verticesAttr.array[i + 3];
                const velocityY = verticesAttr.array[i + 4];

                let newX = x - velocityX;
                let newY = y - velocityY;
                let newVelocityX = velocityX

                if (newY <= -100) newY = 60;
                if (newX <= -100 || newX >= 100) newVelocityX = velocityX * -1;

                newVerticesAttr.push(newX, newY, z, newVelocityX, velocityY)
                newVertices.push(newX, newY, z)
            }

            particles.geometry.setAttribute('position', new Float32BufferAttribute(newVertices, 3));
            particles.geometry.setAttribute('verticesAttr', new Float32BufferAttribute(newVerticesAttr, 5));
        }
    }

    private async setEnvironment() {
        if (!HDR_FILE) return { envMap: null }

        const texture = await new RGBELoader().setDataType(UnsignedByteType).loadAsync(HDR_FILE)
        const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
        this.pmremGenerator.dispose();

        return { envMap }
    }

    private render() {
        this.updateBackground();
        this.activeCamera.updateProjectionMatrix()
        this.renderer.render(this.scene, this.activeCamera);
    }

    private animate() {
        requestAnimationFrame(this.animate);

        this.controls.update();

        const dt = this.clock.getDelta();
        this.mixers.forEach(m => m.update(dt));

        this.render();
        this.autoRotate();
    }

    private resize() {
        const { clientHeight: height, clientWidth: width } = this.el;
        const aspect = width / height;
        const dis = width / 10;

        this.pCamera.aspect = aspect;
        this.pCamera.updateProjectionMatrix();
        this.gCamera.aspect = aspect;

        this.gCamera.updateSize(0, 0, dis * 1.5, dis, dis / aspect);
        this.gCamera.updateProjectionMatrix();


        this.renderer.setSize(width, height);
    }

    private async load(modelInfo: ModelInfo) {
        const { scene: mesh, animations } = await this.loader.loadAsync(modelInfo.url);

        const [pX, pY, pZ] = modelInfo.pos;
        mesh.position.set(pX, pY, pZ);
        const [rX, rY, rZ] = modelInfo.rot;
        mesh.rotation.set(rX, rY, rZ);

        const { scale } = modelInfo
        mesh.scale.set(scale, scale, scale);

        const mixer = new AnimationMixer(mesh);
        mixer.clipAction(animations[0]).setDuration(20).play();
        this.mixers.push(mixer);

        mesh.name = modelInfo.name;
        this.models.add(mesh);
    }

    private autoRotate() {
        if (!this.isAutoRotate) return;
        this.models.rotation.y -= Math.PI / (360 * 5);
    }

    async open() {
        this.isOpen = true;
        if (this.isMusicLoad) {
            !this.audio.isPlaying && this.audio.play();
        }

        await this.gCamera.initDeviceOrientation();
    }

    triggerMusicPlay(play: boolean) {
        play ? (!this.audio.isPlaying && this.audio.play()) : (this.audio.isPlaying && this.audio.pause())
    }

    triggerAutoRotate() {
        this.isAutoRotate = !this.isAutoRotate;
        return this.isAutoRotate;
    }

    changeToGCamera() {
        this.controls.enabled = false;

        this.activeCamera = this.gCamera;
        console.log("use GlassFree3dCamera")
    }

    changeToPCamera() {
        this.controls.enabled = true;
        this.controls.reset();

        this.activeCamera = this.pCamera;
        console.log("use PerspectiveCamera")
    }

    dispose() {
        window.removeEventListener('resize', this.resize);
        this.el?.removeChild(this.renderer.domElement)
    }
}