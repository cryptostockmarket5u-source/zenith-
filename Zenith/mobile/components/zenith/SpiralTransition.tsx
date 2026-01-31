import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

/**
 * SpiralTransition
 * Renders the GSAP spiral animation inside a WebView for mobile.
 */
export default function SpiralTransition() {
    const spiralHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          html, body { 
            margin: 0; 
            padding: 0; 
            background: #000; 
            height: 100vh; 
            width: 100vw; 
            overflow: hidden; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          canvas { 
            display: block;
            width: 100vw; 
            height: 100vh; 
          }
        </style>
      </head>
      <body>
        <canvas id="canvas"></canvas>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
        <script>
            // Ensure script wait for GSAP to load
            function init() {
                if (typeof gsap === 'undefined') {
                    setTimeout(init, 50);
                    return;
                }

                class Vector2D {
                    constructor(x, y) { this.x = x; this.y = y; }
                    static random(min, max) { return min + Math.random() * (max - min); }
                }

                class Vector3D {
                    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
                    static random(min, max) { return min + Math.random() * (max - min); }
                }

                class AnimationController {
                    constructor(canvas, ctx, size) {
                        this.canvas = canvas;
                        this.ctx = ctx;
                        this.size = size;
                        this.time = 0;
                        this.stars = [];
                        this.changeEventTime = 0.32;
                        this.cameraZ = -400;
                        this.cameraTravelDistance = 3400;
                        this.startDotYOffset = 28;
                        this.viewZoom = 100;
                        this.numberOfStars = 4000; // Reduced for mobile performance
                        this.trailLength = 60; // Reduced for mobile performance

                        this.setupRandomGenerator();
                        this.createStars();
                        this.setupTimeline();
                    }

                    setupRandomGenerator() {
                        const originalRandom = Math.random;
                        const customRandom = () => {
                            let seed = 1234;
                            return () => {
                                seed = (seed * 9301 + 49297) % 233280;
                                return seed / 233280;
                            };
                        };
                        Math.random = customRandom();
                        this.stars = [];
                        for (let i = 0; i < this.numberOfStars; i++) {
                            this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance));
                        }
                        Math.random = originalRandom;
                    }

                    createStars() {}

                    setupTimeline() {
                        gsap.to(this, {
                            time: 1,
                            duration: 10, // Faster cycle for transition
                            repeat: -1,
                            ease: "none",
                            onUpdate: () => this.render()
                        });
                    }

                    ease(p, g) {
                        if (p < 0.5) return 0.5 * Math.pow(2 * p, g);
                        else return 1 - 0.5 * Math.pow(2 * (1 - p), g);
                    }

                    easeOutElastic(x) {
                        const c4 = (2 * Math.PI) / 4.5;
                        if (x <= 0) return 0;
                        if (x >= 1) return 1;
                        return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1;
                    }

                    map(value, start1, stop1, start2, stop2) {
                        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
                    }

                    constrain(value, min, max) {
                        return Math.min(Math.max(value, min), max);
                    }

                    lerp(start, end, t) {
                        return start * (1 - t) + end * t;
                    }

                    spiralPath(p) {
                        p = this.constrain(1.2 * p, 0, 1);
                        p = this.ease(p, 1.8);
                        const numberOfSpiralTurns = 6;
                        const theta = 2 * Math.PI * numberOfSpiralTurns * Math.sqrt(p);
                        const r = 170 * Math.sqrt(p);
                        return new Vector2D(r * Math.cos(theta), r * Math.sin(theta) + this.startDotYOffset);
                    }

                    rotate(v1, v2, p, orientation) {
                        const middle = new Vector2D((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
                        const dx = v1.x - middle.x;
                        const dy = v1.y - middle.y;
                        const angle = Math.atan2(dy, dx);
                        const o = orientation ? -1 : 1;
                        const r = Math.sqrt(dx * dx + dy * dy);
                        const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p);
                        return new Vector2D(
                            middle.x + r * (1 + bounce) * Math.cos(angle + o * Math.PI * this.easeOutElastic(p)),
                            middle.y + r * (1 + bounce) * Math.sin(angle + o * Math.PI * this.easeOutElastic(p))
                        );
                    }

                    showProjectedDot(position, sizeFactor) {
                        const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
                        const newCameraZ = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance;
                        if (position.z > newCameraZ) {
                            const dotDepthFromCamera = position.z - newCameraZ;
                            const x = (this.viewZoom * position.x) / dotDepthFromCamera;
                            const y = (this.viewZoom * position.y) / dotDepthFromCamera;
                            const sw = (400 * sizeFactor) / dotDepthFromCamera;
                            this.ctx.beginPath();
                            this.ctx.arc(x, y, sw / 2, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }

                    render() {
                        const ctx = this.ctx;
                        ctx.fillStyle = 'black';
                        ctx.fillRect(0, 0, this.size, this.size);
                        
                        ctx.save();
                        ctx.translate(this.size / 2, this.size / 2);
                        
                        const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1);
                        const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1);
                        
                        ctx.rotate(-Math.PI * this.ease(t2, 2.7));
                        
                        // Draw Trail
                        ctx.fillStyle = 'white';
                        this.drawTrail(t1);
                        
                        // Draw Stars
                        ctx.fillStyle = 'white';
                        for (const star of this.stars) {
                            star.render(t1, this);
                        }
                        
                        ctx.restore();
                    }

                    drawTrail(t1) {
                        for (let i = 0; i < this.trailLength; i++) {
                            const f = this.map(i, 0, this.trailLength, 1.1, 0.1);
                            const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f;
                            const pathTime = t1 - 0.00015 * i;
                            const position = this.spiralPath(pathTime);
                            const basePos = position;
                            const offset = new Vector2D(position.x + 5, position.y + 5);
                            const rotated = this.rotate(basePos, offset, Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5, i % 2 === 0);
                            
                            this.ctx.beginPath();
                            this.ctx.arc(rotated.x, rotated.y, sw / 2, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                }

                class Star {
                    constructor(cameraZ, cameraTravelDistance) {
                        this.angle = Math.random() * Math.PI * 2;
                        this.distance = 30 * Math.random() + 15;
                        this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
                        this.expansionRate = 1.2 + Math.random() * 0.8;
                        this.finalScale = 0.7 + Math.random() * 0.6;
                        this.dx = this.distance * Math.cos(this.angle);
                        this.dy = this.distance * Math.sin(this.angle);
                        this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3;
                        this.z = cameraZ + Math.random() * cameraTravelDistance;
                        this.strokeWeightFactor = Math.pow(Math.random(), 2.0);
                    }

                    render(p, controller) {
                        const spiralPos = controller.spiralPath(this.spiralLocation);
                        const q = p - this.spiralLocation;
                        if (q > 0) {
                            const displacementProgress = controller.constrain(4 * q, 0, 1);
                            const easing = controller.easeOutElastic(displacementProgress);
                            let screenX, screenY;
                            if (displacementProgress < 0.3) {
                                screenX = controller.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, displacementProgress / 0.3);
                                screenY = controller.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, displacementProgress / 0.3);
                            } else {
                                screenX = spiralPos.x + this.dx * displacementProgress;
                                screenY = spiralPos.y + this.dy * displacementProgress;
                            }
                            const vx = (this.z - controller.cameraZ) * screenX / controller.viewZoom;
                            const vy = (this.z - controller.cameraZ) * screenY / controller.viewZoom;
                            const position = new Vector3D(vx, vy, this.z);
                            const dotSize = 8.5 * this.strokeWeightFactor * (1.0 + displacementProgress * 0.2);
                            controller.showProjectedDot(position, dotSize);
                        }
                    }
                }

                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                const dpr = window.devicePixelRatio || 1;
                const size = Math.max(window.innerWidth, window.innerHeight);
                
                canvas.width = size * dpr;
                canvas.height = size * dpr;
                ctx.scale(dpr, dpr);
                
                new AnimationController(canvas, ctx, size);
            }

            init();
        </script>
      </body>
    </html>
    `;

    return (
        <View style={styles.fullscreen}>
            <WebView
                originWhitelist={['*']}
                source={{ html: spiralHTML }}
                style={styles.webview}
                scrollEnabled={false}
                pointerEvents="none"
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => <View style={{ flex: 1, backgroundColor: 'black' }} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    fullscreen: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
        zIndex: 99999,
    },
    webview: {
        flex: 1,
        backgroundColor: 'black',
    }
});
