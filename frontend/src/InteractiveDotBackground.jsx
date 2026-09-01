import { useEffect, useRef } from 'react';

export default function InteractiveDotBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 160 // Expanded interaction radius for a larger reveal zone
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initGrid();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const spacing = 32;
    let dots = [];

    function initGrid() {
      dots = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            baseX: i * spacing,
            baseY: j * spacing,
            x: i * spacing,
            y: j * spacing,
            baseSize: 1.5,
            size: 1.5,
            baseAlpha: 0.15,
            alpha: 0.15
          });
        }
      }
    }

    initGrid();

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Draw cursor ambient glow ring
      if (mouse.x > 0 && mouse.y > 0) {
        const auraGradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius
        );
        auraGradient.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
        auraGradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
        auraGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouse.x - dot.baseX;
        const dy = mouse.y - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const factor = 1 - dist / mouse.radius;
          
          // Boost size expansion and boost opacity up to 100%
          dot.size = dot.baseSize + factor * 4.5;
          dot.alpha = Math.min(1, dot.baseAlpha + factor * 0.9);

          // Gentle magnetic push away from cursor
          const angle = Math.atan2(dy, dx);
          const push = factor * 14;
          dot.x = dot.baseX - Math.cos(angle) * push;
          dot.y = dot.baseY - Math.sin(angle) * push;
        } else {
          dot.size += (dot.baseSize - dot.size) * 0.1;
          dot.alpha += (dot.baseAlpha - dot.alpha) * 0.1;
          dot.x += (dot.baseX - dot.x) * 0.1;
          dot.y += (dot.baseY - dot.y) * 0.1;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);

        if (dot.alpha > 0.4) {
          // Intense gold bloom on active dots
          ctx.fillStyle = `rgba(251, 191, 36, ${dot.alpha})`;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
          ctx.shadowBlur = dot.alpha * 12;
        } else {
          // Standard background state
          ctx.fillStyle = `rgba(148, 163, 184, ${dot.alpha})`;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}