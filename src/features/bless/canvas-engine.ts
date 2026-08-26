import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

interface MouseState extends Point {
  active: boolean;
}

interface TextLayout {
  points: Point[];
  lines: string[];
  fontSize: number;
  lineHeight: number;
  startY: number;
}

interface CanvasRuntime {
  formText: (text: string) => void;
  releaseText: () => void;
}

const particleColors = ["#e0b0ff", "#ffb7c5", "#b4e4ff", "#ffffff", "#e6e6fa"];
const starColors = ["#ffffff", "#f0f8ff", "#e0ffff", "#fffacd", "#f0e68c"];

function randomFrom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

class Particle {
  x: number;
  y: number;
  destination: Point;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  targeting = false;
  ease = 0.05;
  private readonly width: number;
  private readonly height: number;
  private readonly flickerSpeed = 0.002 + Math.random() * 0.005;
  private readonly flickerOffset = Math.random() * Math.PI * 2;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.destination = { x: this.x, y: this.y };
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.radius = Math.random() * 1.2 + 0.3;
    this.color = randomFrom(particleColors);
    this.alpha = Math.random() * 0.6 + 0.4;
  }

  update(mouse: MouseState) {
    if (this.targeting) {
      const dx = this.destination.x + (Math.random() - 0.5) * 0.3 - this.x;
      const dy = this.destination.y + (Math.random() - 0.5) * 0.3 - this.y;
      this.x += dx * this.ease;
      this.y += dy * this.ease;
      const wave = Math.sin(
        Date.now() * this.flickerSpeed + this.flickerOffset,
      );
      this.alpha = 0.75 + wave * 0.25;
    } else {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > this.width) this.vx *= -1;
      if (this.y < 0 || this.y > this.height) this.vy *= -1;
      this.alpha = Math.max(0.4, this.alpha - 0.005);
    }

    if (!mouse.active) return;
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0 || distance >= 80) return;
    const force = (80 - distance) / 80;
    this.x -= (dx / distance) * 15 * force;
    this.y -= (dy / distance) * 15 * force;
  }

  draw(context: CanvasRenderingContext2D) {
    context.globalAlpha = this.alpha;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    if (!this.targeting && (this.radius <= 1 || this.alpha <= 0.5)) return;
    context.globalAlpha = this.alpha * 0.28;
    context.beginPath();
    context.arc(this.x, this.y, this.radius * 2.6, 0, Math.PI * 2);
    context.fill();
  }
}

class BackgroundStar {
  private readonly x: number;
  private readonly y: number;
  private readonly size = Math.random() * 1.5 + 0.3;
  private readonly color = randomFrom(starColors);
  private readonly baseAlpha = Math.random() * 0.6 + 0.1;
  private readonly speed = Math.random() * 0.003 + 0.0005;
  private readonly offset = Math.random() * Math.PI * 2;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
  }

  draw(context: CanvasRenderingContext2D) {
    const primary = Math.sin(Date.now() * this.speed + this.offset);
    const secondary = Math.sin(Date.now() * this.speed * 2.5 + this.offset);
    context.globalAlpha = Math.max(
      0,
      Math.min(
        1,
        this.baseAlpha +
          ((primary + secondary * 0.5) / 1.5) * 0.3 * this.baseAlpha,
      ),
    );
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
  }
}

class ShootingStar {
  private x: number;
  private y: number;
  private readonly length = Math.random() * 120 + 60;
  private readonly speed = Math.random() * 15 + 10;
  private readonly size = Math.random() * 1.5 + 0.5;
  private readonly angle = Math.PI / 4 + (Math.random() - 0.5) * 0.1;
  private readonly height: number;
  dead = false;

  constructor(width: number, height: number) {
    this.height = height;
    this.x = Math.random() * width * 1.2 - width * 0.1;
    this.y = Math.random() * height * 0.6;
  }

  update() {
    this.x -= this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
    this.dead = this.x < -this.length || this.y > this.height + this.length;
  }

  draw(context: CanvasRenderingContext2D) {
    const tailX = this.x + this.length * Math.cos(this.angle);
    const tailY = this.y - this.length * Math.sin(this.angle);
    const gradient = context.createLinearGradient(this.x, this.y, tailX, tailY);
    gradient.addColorStop(0, "rgba(255,255,255,.9)");
    gradient.addColorStop(0.3, "rgba(180,200,255,.2)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.globalAlpha = 1;
    context.strokeStyle = gradient;
    context.lineWidth = this.size;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(tailX, tailY);
    context.stroke();
  }
}

function getPixelPoints(
  text: string,
  width: number,
  height: number,
): TextLayout {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const mobile = width < 768;
  const fontSize = mobile
    ? Math.floor(width / (text.length > 10 ? 10 : 8))
    : 75;
  const lineHeight = fontSize * 1.5;
  if (!context)
    return {
      points: [],
      lines: [text],
      fontSize,
      lineHeight,
      startY: height / 2,
    };
  canvas.width = width;
  canvas.height = height;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  const lines: string[] = [];
  for (const segment of text.replaceAll("\\n", "\n").split("\n")) {
    if (!segment || context.measureText(segment).width <= width * 0.9) {
      lines.push(segment);
      continue;
    }
    let current = "";
    for (const character of segment) {
      if (
        current &&
        context.measureText(current + character).width > width * 0.9
      ) {
        lines.push(current);
        current = character;
      } else current += character;
    }
    if (current) lines.push(current);
  }
  const startY = height / 2 - (lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => {
    context.strokeText(line, width / 2, startY + index * lineHeight);
    context.fillText(line, width / 2, startY + index * lineHeight);
  });
  const pixels = context.getImageData(0, 0, width, height).data;
  const points: Point[] = [];
  const step = mobile ? 2 : 3;
  const threshold = mobile ? 150 : 110;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (pixels[(y * width + x) * 4 + 3] > threshold) points.push({ x, y });
    }
  }
  return { points, lines, fontSize, lineHeight, startY };
}

export function useBlessCanvas(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const runtimeRef = useRef<CanvasRuntime | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame = 0;
    let particles: Particle[] = [];
    let stars: BackgroundStar[] = [];
    let meteors: ShootingStar[] = [];
    let textLayout: TextLayout | null = null;
    let parallax = { x: 0, y: 0 };
    const mouse: MouseState = { x: -1000, y: -1000, active: false };
    let mouseTimer = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const particleCount = reducedMotion ? 450 : width < 768 ? 1800 : 2200;
      particles = Array.from(
        { length: particleCount },
        () => new Particle(width, height),
      );
      stars = Array.from(
        { length: reducedMotion ? 120 : 300 },
        () => new BackgroundStar(width, height),
      );
      meteors = [];
      textLayout = null;
    };

    const formText = (text: string) => {
      textLayout = getPixelPoints(text, width, height);
      const points = [...textLayout.points].sort(() => Math.random() - 0.5);
      particles.forEach((particle, index) => {
        const target = points[index];
        particle.targeting = Boolean(target);
        if (target) {
          particle.destination = target;
          particle.ease = reducedMotion ? 0.12 : 0.03 + Math.random() * 0.04;
        } else {
          particle.vx = (Math.random() - 0.5) * 0.5;
          particle.vy = (Math.random() - 0.5) * 0.5;
        }
      });
    };
    const releaseText = () => {
      textLayout = null;
      particles.forEach((particle) => {
        particle.targeting = false;
        particle.vx = (Math.random() - 0.5) * 3;
        particle.vy = (Math.random() - 0.5) * 3;
      });
    };
    runtimeRef.current = { formText, releaseText };

    const animate = () => {
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(parallax.x * 0.02, parallax.y * 0.02);
      stars.forEach((star) => star.draw(context));
      context.restore();

      if (!reducedMotion && Math.random() < 0.02)
        meteors.push(new ShootingStar(width, height));
      context.save();
      context.translate(parallax.x * 0.04, parallax.y * 0.04);
      meteors.forEach((meteor) => {
        meteor.update();
        meteor.draw(context);
      });
      meteors = meteors.filter((meteor) => !meteor.dead);
      context.restore();

      if (textLayout) {
        context.save();
        context.translate(parallax.x * 0.05, parallax.y * 0.05);
        context.font = `bold ${textLayout.fontSize}px Georgia, "Songti SC", serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowBlur = 30;
        context.shadowColor = "rgba(135,206,250,.4)";
        context.strokeStyle = "rgba(135,206,250,.08)";
        textLayout.lines.forEach((line, index) =>
          context.strokeText(
            line,
            width / 2,
            textLayout!.startY + index * textLayout!.lineHeight,
          ),
        );
        context.restore();
      }

      context.save();
      context.translate(parallax.x * 0.05, parallax.y * 0.05);
      particles.forEach((particle) => {
        particle.update(mouse);
        particle.draw(context);
      });
      context.restore();
      context.globalAlpha = 1;
      const targetX = mouse.active ? (mouse.x - width / 2) * 0.5 : 0;
      const targetY = mouse.active ? (mouse.y - height / 2) * 0.5 : 0;
      parallax.x += (targetX - parallax.x) * 0.05;
      parallax.y += (targetY - parallax.y) * 0.05;
      frame = window.requestAnimationFrame(animate);
    };

    const handlePointer = (event: PointerEvent) => {
      mouse.active = true;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      window.clearTimeout(mouseTimer);
      mouseTimer = window.setTimeout(() => {
        mouse.active = false;
      }, 2_000);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => {
      runtimeRef.current = null;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(mouseTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, [canvasRef]);

  const formText = useCallback(
    (text: string) => runtimeRef.current?.formText(text),
    [],
  );
  const releaseText = useCallback(() => runtimeRef.current?.releaseText(), []);
  return { formText, releaseText };
}
