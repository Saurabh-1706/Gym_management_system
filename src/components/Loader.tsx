"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function Loader({
  text,
  gymName,
  gymLogo,
}: {
  text?: string;
  gymName?: string;
  gymLogo?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const loadingPhrases = [
    "CALIBRATING PERFORMANCE...",
    "SYNCING ATHLETE DATA...",
    "PREPARING THE GRIND...",
    "OPTIMIZING WORKOUT FLOW...",
    "SECURING METRICS...",
    "READYING IRON PULSE..."
  ];

  // If a custom text is passed, we use it. Otherwise, cycle through phrases.
  const activePhrase = text || loadingPhrases[phraseIndex];

  // 1. Simulated progress state animation
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const updateLoading = () => {
      const now = Date.now();
      if (now - lastTime > 60) {
        lastTime = now;
        setProgress((prev) => {
          if (prev >= 100) {
            return 0; // Loops for continuous screen state representation
          }
          const increment = Math.random() * 3 + 0.5;
          const next = prev + increment;
          return next >= 100 ? 100 : next;
        });
      }
      animationFrameId = requestAnimationFrame(updateLoading);
    };

    animationFrameId = requestAnimationFrame(updateLoading);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Update phrase index based on simulated progress
  useEffect(() => {
    const currentPhraseIndex = Math.floor((progress / 100) * loadingPhrases.length);
    if (currentPhraseIndex < loadingPhrases.length) {
      setPhraseIndex(currentPhraseIndex);
    }
  }, [progress]);

  // 2. Parallax mouse movement listener
  useEffect(() => {
    const handleMouseParallax = (e: MouseEvent) => {
      if (!mainRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      mainRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handleMouseParallax);
    return () => window.removeEventListener("mousemove", handleMouseParallax);
  }, []);

  // 3. WebGL Canvas shader lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const resizeCanvas = () => {
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 800;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      vec3 primaryColor = vec3(0.976, 0.451, 0.086);
      vec3 surfaceColor = vec3(0.075, 0.075, 0.075);

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 centeredUv = (uv - 0.5) * 2.0;
        centeredUv.x *= u_resolution.x / u_resolution.y;

        float dist = length(centeredUv);
        float pulse = sin(dist * 10.0 - u_time * 4.0) * 0.5 + 0.5;
        pulse *= exp(-dist * 2.0);

        float n = noise(uv * 4.0 + u_time * 0.5);
        float n2 = noise(uv * 8.0 - u_time * 0.8);
        float energy = pow(n * n2, 2.0) * 1.5;

        vec3 color = mix(surfaceColor, primaryColor, pulse * energy + pow(pulse, 8.0) * 0.5);
        float glow = 0.02 / dist;
        color += primaryColor * glow * (sin(u_time * 2.0) * 0.2 + 0.8);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const cs = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = cs(gl.VERTEX_SHADER, vs);
    const fragmentShader = cs(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    const render = (t: number) => {
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A0A] overflow-hidden flex items-center justify-center min-h-screen text-left">
      {/* Energy Field / WebGL Shader Container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="relative w-[800px] h-[800px] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-full block"
            style={{ width: "100%", height: "100%" }}
          />
          {/* Radial Mask for high-end glass integration */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#0A0A0A] to-[#0A0A0A] pointer-events-none" />
        </div>
      </div>

      {/* Main Content Canvas */}
      <main
        ref={mainRef}
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 transition-transform duration-100 ease-out"
      >
        {/* Brand Identity Section */}
        <div className="mb-12 cursor-default select-none flex flex-col items-center gap-4">
          {/* Gym Logo / Avatar with animated pulse ring */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow ring */}
            <span
              className="absolute rounded-full animate-ping opacity-30"
              style={{
                width: 80,
                height: 80,
                backgroundColor: "#f97316",
              }}
            />
            {/* Spinner ring */}
            <span
              className="absolute rounded-full border-2 border-t-transparent animate-spin"
              style={{
                width: 90,
                height: 90,
                borderColor: "#f97316",
              }}
            />
            {/* Logo or initials */}
            {gymLogo ? (
              <img
                src={gymLogo}
                alt={gymName || "Gym Logo"}
                className="w-16 h-16 rounded-full object-cover z-10 border-2 border-[#f97316]/40"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full z-10 flex items-center justify-center border-2 border-[#f97316]/30"
                style={{ background: "#1a1a1a" }}
              >
                {gymName ? (
                  <span className="font-headline text-2xl text-[#f97316]">
                    {gymName
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                ) : (
                  <span className="text-[#f97316] font-bold text-2xl">⚡</span>
                )}
              </div>
            )}
          </div>

          <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl text-[#f97316] tracking-wider drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] uppercase">
            {gymName || "IRON PULSE"}
          </h1>
          <p className="font-body text-xs sm:text-sm text-[#e0c0b1] tracking-[0.5em] mt-[-5px] opacity-80 uppercase">
            Elite Performance
          </p>
        </div>

        {/* Loading Interface Section */}
        <div className="w-full max-w-xs sm:max-w-md space-y-6">
          {/* Sleek Progress Track */}
          <div className="relative h-[2px] w-full bg-[#201f1f] overflow-hidden rounded-full border border-white/5">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#f97316] to-[#ffb690] shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Contextual Status and Metrics */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Loader2 className="text-[#f97316] animate-spin" size={18} />
              <p className="font-body text-xs sm:text-sm text-[#e5e2e1] uppercase tracking-[0.2em] transition-opacity duration-300">
                {activePhrase}
              </p>
            </div>
            <div className="font-headline text-4xl sm:text-5xl text-white opacity-40">
              {Math.floor(progress)}%
            </div>
          </div>
        </div>
      </main>

      {/* Aesthetic Decorative Elements */}
      <div className="fixed bottom-12 left-12 hidden md:block">
        <div className="flex items-center gap-4 text-white/10 select-none">
          <span
            className="text-[10px] font-body uppercase tracking-tighter opacity-50"
            style={{ writingMode: "vertical-rl" }}
          >
            System-Rev: 4.0.2
          </span>
          <div className="h-16 w-[1px] bg-white/5" />
        </div>
      </div>

      <div className="fixed top-12 right-12 hidden md:block select-none">
        <div className="text-right">
          <p className="font-body text-[10px] sm:text-xs text-[#22c55e]/30 tracking-widest uppercase">
            Encryption Active
          </p>
          <p className="font-body text-[10px] sm:text-xs text-white/5 mt-1">
            SECURE_LINK_STABLE
          </p>
        </div>
      </div>
    </div>
  );
}
