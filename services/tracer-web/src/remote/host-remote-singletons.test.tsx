import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { monitorQueryClient as apiSurfaceQueryClient } from "~tracer-web/shared/api/index.js";
import { monitorQueryClient as hostQueryClient } from "~tracer-web/shared/api/query-client.js";
import {
  createUiStore,
  useMainView,
  UiStoreProvider,
  type UiStoreApi,
} from "~tracer-web/shared/store/index.js";

// 연합이 내보내는 표면(`./api`, `./store`)을 리모트가 그대로 받았을 때를 흉내 낸다.

function ProbePanel({ testId }: { readonly testId: string }) {
  const mainView = useMainView();
  return <span data-testid={testId}>{mainView}</span>;
}

describe("호스트와 리모트가 공유하는 연합 표면", () => {
  afterEach(cleanup);

  it("shared/api가 내보내는 QueryClient는 호스트가 만든 것과 같은 인스턴스다", () => {
    expect(apiSurfaceQueryClient).toBe(hostQueryClient);
  });

  it("shared/store로 받은 store api는 여러 소비자가 같은 인스턴스를 공유한다", () => {
    const sharedStore: UiStoreApi = createUiStore({ persisted: false });

    render(
      <UiStoreProvider store={sharedStore}>
        <ProbePanel testId="host-probe" />
        <ProbePanel testId="remote-probe" />
      </UiStoreProvider>,
    );

    expect(screen.getByTestId("host-probe").textContent).toBe("feed");
    expect(screen.getByTestId("remote-probe").textContent).toBe("feed");

    act(() => {
      sharedStore.getState().setMainView("graph");
    });

    expect(screen.getByTestId("host-probe").textContent).toBe("graph");
    expect(screen.getByTestId("remote-probe").textContent).toBe("graph");
  });
});
