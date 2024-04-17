export const createDailyExpenseReportMessage = (recommendation: any) => {
  // 디스코드 웹 훅 페이로드 (오늘의 지출 추천)
  const expenseRecommendations =
    recommendation.todayRecommendedExpenseByCategoryExcludingTotal
      .map(
        (item) =>
          `${item.categoryName} - 추천 지출: ${item.todaysRecommendedExpenditureAmount}원`,
      )
      .join('\n') // 각 항목 사이에 줄바꿈 추가

  return {
    username: 'Money-Note',
    avatar_url:
      'https://dl.dropboxusercontent.com/scl/fi/ybjo7l2ufe770roauleb9/logo.png?rlkey=70fmpfkpue5mpsuopmg5y9yij',
    content: '오늘도 돈을 아껴서 사용해보아요~',
    embeds: [
      {
        author: {
          name: '오늘의 지출 추천',
          icon_url:
            'https://dl.dropboxusercontent.com/scl/fi/smnnzip44ci059kfwywzx/free-icon-money-icons-351769.png?rlkey=id1pzht1268gs5cuj0yslsoyj&dl=0',
        },
        title: '오늘 얼마 쓸 수 있는지 알려드릴게요!',
        description: `${recommendation.message}\n\n${expenseRecommendations}`, // 메시지와 지출 추천 사항을 합친 문자열
      },
    ],
  }
}

export const createDailyExpenseGuideMessage = (guide: any) => {
  // 디스코드 웹 훅 페이로드 (오늘의 지출 안내)
  return {
    username: 'Money-Note',
    content: '오늘의 지출 추천',
    embeds: [
      {
        title: '오늘의 지출 추천',
        description: guide.message,
      },
    ],
  }
}
