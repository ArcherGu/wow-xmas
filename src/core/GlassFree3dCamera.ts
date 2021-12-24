import { PerspectiveCamera, Camera, Vector3, Quaternion, Euler, MathUtils } from "three"

/**
 * 3D cameras that cannot be accurately defined 😂
 *
 * @typed ArcherGu
 * @borrows https://game.gtimg.cn/images/js/sign/glassfree3d/room1.html
 * @export
 * @class GlassFree3dCamera
 * @extends {PerspectiveCamera}
 */
export class GlassFree3dCamera extends PerspectiveCamera {
    left: number;
    right: number;
    top: number;
    bottom: number;
    ow: number;
    oh: number;
    oz: number;
    near: number;
    far: number;
    ori_pos: Vector3;
    move_pos: Vector3;
    enabled: boolean;
    dcontrols_enabled: boolean;
    originDeviceFace: Quaternion | null = null;
    screenOrientation: number = 0;
    DeviceFace: Vector3 | null = null;
    move_flag: boolean = false;

    constructor(xAxis: number, yAxis: number, zAxis: number, width: number, height: number) {
        super();

        // @ts-ignore
        this.type = 'GlassFree3dCamera';

        this.left = xAxis - width / 2;
        this.right = xAxis + width / 2;
        this.top = yAxis + height / 2;
        this.bottom = yAxis - height / 2;

        this.ow = width;
        this.oh = height;

        this.oz = zAxis;

        this.near = 0.1;
        this.far = 1000;

        this.position.set(xAxis, yAxis, zAxis);
        this.ori_pos = new Vector3(xAxis, yAxis, zAxis);
        this.move_pos = this.position.clone();
        this.enabled = true;

        this.dcontrols_enabled = false;
        this.updateProjectionMatrix();
    }

    private getDeviceFce(alpha: number, beta: number, gamma: number, orient: number) {
        const zee = new Vector3(0, 0, 1);

        const euler = new Euler();

        const q0 = new Quaternion();

        const q1 = new Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

        const quaternion = new Quaternion();

        euler.set(beta, alpha, - gamma, 'YXZ');

        quaternion.setFromEuler(euler);

        quaternion.multiply(q1);

        quaternion.multiply(q0.setFromAxisAngle(zee, -orient));

        return quaternion.invert();
    }

    private onDeviceOrientationChangeEvent(event: DeviceOrientationEvent) {
        const alpha = event.alpha ? MathUtils.degToRad(event.alpha) : 0;

        const beta = event.beta ? MathUtils.degToRad(event.beta) : 0;

        const gamma = event.gamma ? MathUtils.degToRad(event.gamma) : 0;

        const orient = (event as any).screenOrientation ? MathUtils.degToRad((event as any).screenOrientation) : 0;

        if (!this.originDeviceFace) {
            this.originDeviceFace = this.getDeviceFce(alpha, beta, gamma, orient).invert();
        } else {
            const quaternion = this.getDeviceFce(alpha, beta, gamma, orient);
            this.DeviceFace = new Vector3(0, 0, 1).applyQuaternion(this.originDeviceFace);
            this.DeviceFace.applyQuaternion(quaternion);
        }
    }

    private onScreenOrientationChangeEvent() {
        this.screenOrientation = window.orientation || 0;
    }

    private removeDeviceOrientation() {
        window.removeEventListener('orientationchange', this.onScreenOrientationChangeEvent.bind(this), false);
        window.removeEventListener('deviceorientation', this.onDeviceOrientationChangeEvent.bind(this), false);
    }

    public async initDeviceOrientation() {
        this.removeDeviceOrientation();
        this.onScreenOrientationChangeEvent();

        if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
            window.addEventListener('orientationchange', this.onScreenOrientationChangeEvent.bind(this), false);
            window.addEventListener('deviceorientation', this.onDeviceOrientationChangeEvent.bind(this), false);
        } else {
            const state: string = await (DeviceOrientationEvent as any).requestPermission();
            if (state === "granted") {
                window.addEventListener('orientationchange', this.onScreenOrientationChangeEvent.bind(this), false);
                window.addEventListener('deviceorientation', this.onDeviceOrientationChangeEvent.bind(this), false);
            }
            else {
                throw "user denied";
            }
        }

        this.originDeviceFace = null;
        this.dcontrols_enabled = true;
    }

    private deviceOrientationUpdate() {
        if (this.dcontrols_enabled === false || this.move_flag === true) return;

        var d = this.DeviceFace;
        var o = this.originDeviceFace;

        if (d && o) {
            this.position.x = (this.screenOrientation === 0 ? d.x : d.y) * this.oz;
            this.position.y = (this.screenOrientation === 0 ? d.y : d.x) * this.oz;
            this.position.z = d.z * this.oz + this.move_pos.z;
        }
    }

    public updateProjectionMatrix() {
        if (this.enabled === true) {

            if (this.dcontrols_enabled === true) {
                this.deviceOrientationUpdate();
            }

            const left = this.ori_pos.x - this.position.x + this.left,
                right = this.ori_pos.x - this.position.x + this.right,
                top = this.ori_pos.y - this.position.y + this.top,
                bottom = this.ori_pos.y - this.position.y + this.bottom,
                zoom = this.near / (this.position.z - this.ori_pos.z + this.oz);

            this.projectionMatrix.makePerspective(left * zoom, right * zoom, top * zoom, bottom * zoom, this.near, this.far);
            this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
        }
    }

    public updateSize(xAxis: number, yAxis: number, zAxis: number, width: number, height: number) {
        this.originDeviceFace = null;
        this.left = xAxis - width / 2;
        this.right = xAxis + width / 2;
        this.top = yAxis + height / 2;
        this.bottom = yAxis - height / 2;

        this.ow = width;
        this.oh = height;

        this.oz = zAxis;

        this.position.set(xAxis, yAxis, zAxis);
        this.ori_pos = new Vector3(xAxis, yAxis, zAxis);
        this.move_pos = this.position.clone();
    }
}