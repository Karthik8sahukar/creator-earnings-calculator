import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreatorAvatar } from "../CreatorAvatar";

describe("<CreatorAvatar />", () => {
  it("renders an <img> when a src is provided", () => {
    render(<CreatorAvatar src="https://yt3.ggpht.com/x.jpg" alt="MrBeast" initial="M" />);
    const img = screen.getByRole("img", { name: "MrBeast" });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("yt3.ggpht.com");
  });

  it("falls back to the initial when src is null", () => {
    render(<CreatorAvatar src={null} alt="MrBeast" initial="M" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("falls back to the initial when src is an empty / whitespace string", () => {
    render(<CreatorAvatar src="   " alt="MrBeast" initial="M" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("switches to the initial on image load failure (never a broken image icon)", () => {
    render(<CreatorAvatar src="https://yt3.ggpht.com/x.jpg" alt="MrBeast" initial="M" />);
    const img = screen.getByRole("img", { name: "MrBeast" });
    fireEvent.error(img);
    // After onError, the image is unmounted and the initial appears.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("applies the responsive size classes (40 / 48 / 56)", () => {
    const { container } = render(
      <CreatorAvatar src={null} alt="MrBeast" initial="M" />,
    );
    // The outer wrapper carries the responsive height/width classes.
    // Tailwind classnames are enough to assert on since they encode
    // the exact px sizes required by the spec.
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("h-10", "w-10");        // mobile   40
    expect(wrapper).toHaveClass("sm:h-12", "sm:w-12");  // tablet   48
    expect(wrapper).toHaveClass("lg:h-14", "lg:w-14");  // desktop  56
  });
});
