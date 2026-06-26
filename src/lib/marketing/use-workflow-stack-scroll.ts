import { useEffect, type RefObject } from "react";

export const WORKFLOW_STACK_DESKTOP_QUERY = "(min-width: 768px)";

function cssLengthToPx(value: string, rootFontSize: number): number {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  if (trimmed.endsWith("px")) {
    return parseFloat(trimmed);
  }

  if (trimmed.endsWith("rem")) {
    return parseFloat(trimmed) * rootFontSize;
  }

  return parseFloat(trimmed) * rootFontSize;
}

function readStackMetrics(shell: HTMLElement) {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const styles = getComputedStyle(shell);

  return {
    stackGap: cssLengthToPx(styles.getPropertyValue("--how-stack-gap") || "1.75rem", rootFontSize),
    stackTop: cssLengthToPx(styles.getPropertyValue("--how-stack-top") || "7.5rem", rootFontSize),
    titleOffset: cssLengthToPx(styles.getPropertyValue("--how-title-offset") || "2.65rem", rootFontSize)
  };
}

function currentTranslateY(element: HTMLElement) {
  const transform = window.getComputedStyle(element).transform;

  if (!transform || transform === "none") {
    return 0;
  }

  return new DOMMatrixReadOnly(transform).m42;
}

export function useWorkflowStackScroll({
  copyRef,
  frameRefs,
  sectionRef
}: {
  copyRef: RefObject<HTMLDivElement | null>;
  frameRefs: RefObject<Array<HTMLDivElement | null>>;
  sectionRef: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const section = sectionRef.current;
    const copy = copyRef.current;
    const shell = section?.querySelector<HTMLElement>(".open-spot-how-shell") ?? null;

    if (!section || !copy || !shell) {
      return;
    }

    const stackSection = section;
    const stackCopy = copy;
    const stackShell = shell;
    const desktop = window.matchMedia(WORKFLOW_STACK_DESKTOP_QUERY);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;

    function activeFrames() {
      return frameRefs.current.filter((frame): frame is HTMLDivElement => frame !== null);
    }

    function clearStack() {
      stackSection.classList.remove("is-js-stack");
      stackCopy.style.transform = "";
      stackCopy.style.willChange = "";

      activeFrames().forEach((frame) => {
        frame.style.transform = "";
        frame.style.willChange = "";
      });
    }

    function updateStack() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;

        if (!desktop.matches || reduceMotion.matches) {
          clearStack();
          return;
        }

        const frames = activeFrames();

        if (frames.length === 0) {
          return;
        }

        stackSection.classList.add("is-js-stack");

        const { stackGap, stackTop, titleOffset } = readStackMetrics(stackShell);
        const sectionRect = stackSection.getBoundingClientRect();
        const copyTop = stackTop;
        const cardBaseTop = stackTop + titleOffset;
        const copyRect = stackCopy.getBoundingClientRect();
        const copyNaturalTop = copyRect.top - currentTranslateY(stackCopy);
        const copyMaxTranslate = sectionRect.bottom - copyTop - stackCopy.offsetHeight;
        const copyTranslateY = Math.max(0, Math.min(copyTop - copyNaturalTop, copyMaxTranslate));

        stackCopy.style.willChange = "transform";
        stackCopy.style.transform = copyTranslateY > 0
          ? `translate3d(0, ${copyTranslateY.toFixed(2)}px, 0)`
          : "";

        frames.forEach((frame, index) => {
          const targetTop = cardBaseTop + index * stackGap;
          const frameRect = frame.getBoundingClientRect();
          const normalTop = frameRect.top - currentTranslateY(frame);
          const maxTranslate = sectionRect.bottom - targetTop - frame.offsetHeight;
          const translateY = Math.max(0, Math.min(targetTop - normalTop, maxTranslate));

          frame.style.willChange = "transform";
          frame.style.transform = translateY > 0
            ? `translate3d(0, ${translateY.toFixed(2)}px, 0)`
            : "";
        });
      });
    }

    updateStack();
    window.addEventListener("scroll", updateStack, { passive: true });
    window.addEventListener("resize", updateStack);
    desktop.addEventListener("change", updateStack);
    reduceMotion.addEventListener("change", updateStack);

    return () => {
      window.removeEventListener("scroll", updateStack);
      window.removeEventListener("resize", updateStack);
      desktop.removeEventListener("change", updateStack);
      reduceMotion.removeEventListener("change", updateStack);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      clearStack();
    };
  }, [copyRef, frameRefs, sectionRef]);
}
