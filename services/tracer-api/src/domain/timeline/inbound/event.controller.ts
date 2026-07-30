import { Controller, Get, Headers, NotFoundException, Param } from "@nestjs/common";
import { MONITOR_USER_HEADER } from "@agent-tracer/kernel";
import { GetEventUseCase } from "~tracer-api/domain/timeline/application/get.event.usecase.js";
import { pathParamPipe } from "~tracer-api/support/path-param.pipe.js";
import { resolveUserId } from "~tracer-api/support/request-user.js";

@Controller("api/v1/events")
export class EventController {
    constructor(private readonly getEvent: GetEventUseCase) {}

    // events/search가 이 자리보다 먼저 등록되어야 검색 경로가 식별자로 잡히지 않는다.
    @Get(":eventId")
    async event(
        @Headers(MONITOR_USER_HEADER) user: string | undefined,
        @Param("eventId", pathParamPipe) eventId: string,
    ) {
        const event = await this.getEvent.execute({ userId: resolveUserId(user), eventId });
        if (event === null) throw new NotFoundException("Event not found");
        return { event };
    }
}
