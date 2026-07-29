/** 설정 화면이 고를 수 있는 모델이며 서버가 단가를 아는 모델만 여기 담긴다. */
export interface ModelOptionDto {
    readonly id: string;
    readonly label: string;
}

export interface SettingDto {
    readonly key: string;
    readonly maskedValue: string;
    readonly hasValue: true;
    readonly updatedAt: string;
}
