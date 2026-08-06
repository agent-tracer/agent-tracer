/** 발화 목록이 다시 읽힐 때마다 마지막 발화로 되돌리면 사용자가 고른 자리가 사라지므로, 고른 앵커가 아직 목록에 있으면 그대로 둔다. */
export function resolveAnchorEventId(
  current: string,
  inputs: readonly { readonly eventId: string }[],
): string {
  if (current !== "" && inputs.some((input) => input.eventId === current)) return current;
  return inputs.at(-1)?.eventId ?? "";
}
