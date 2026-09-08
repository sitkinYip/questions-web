import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ExtraMessages } from "./ExtraMessages";

it("renders passive text without executing markup or consuming unknown fields", () => {
  const { container } = render(
    <ExtraMessages
      value={{
        extra: { experience: 9999 },
        extraDisplay: [
          {
            key: "custom",
            label: "专属提示",
            text: "<img src=x onerror=alert(1)>",
          },
        ],
      }}
    />,
  );
  expect(screen.getByText("专属提示")).toBeInTheDocument();
  expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
  expect(container).not.toHaveTextContent("9999");
});
it("leaves existing layouts empty when no display configuration exists", () => {
  const { container } = render(<ExtraMessages value={{}} />);
  expect(container).toBeEmptyDOMElement();
});
