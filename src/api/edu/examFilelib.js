import request from '@/utils/request'

// 查询考试试卷提交与修改列表
export function listExamFilelib(query) {
  return request({
    url: '/edu/examFilelib/list',
    method: 'get',
    params: query
  })
}

// 查询考试试卷提交与修改详细
export function getExamFilelib(id) {
  return request({
    url: '/edu/examFilelib/' + id,
    method: 'get'
  })
}

// 新增考试试卷提交与修改
export function addExamFilelib(data) {
  return request({
    url: '/edu/examFilelib',
    method: 'post',
    data: data
  })
}

// 修改考试试卷提交与修改
export function updateExamFilelib(data) {
  return request({
    url: '/edu/examFilelib',
    method: 'put',
    data: data
  })
}

// 删除考试试卷提交与修改
export function delExamFilelib(id) {
  return request({
    url: '/edu/examFilelib/' + id,
    method: 'delete'
  })
}
