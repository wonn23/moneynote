export type MockService<T = any> = Partial<Record<keyof T, jest.Mock>>

export class MockServiceFactory {
  static getMockService<T>(type: new (...args: any[]) => T): MockService<T> {
    const mockService: MockService<T> = {}

    Object.getOwnPropertyNames(type.prototype)
      .filter((key: string) => key !== 'constructor')
      .forEach((key: string) => {
        mockService[key] = jest.fn()
      })

    return mockService
  }
}
