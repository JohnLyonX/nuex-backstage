import request from '@/utils/request'

// 查询课程考试列表
export function listExercises(query) {
  return request({
    url: '/edu/exercises/list',
    method: 'get',
    params: query
  })
}

// 查询课程考试详细
export function getExercises(id) {
  return request({
    url: '/edu/exercises/' + id,
    method: 'get'
  })
}

// 新增课程考试
export function addExercises(data) {
  return request({
    url: '/edu/exercises',
    method: 'post',
    data: data
  })
}

// 修改课程考试
export function updateExercises(data) {
  return request({
    url: '/edu/exercises',
    method: 'put',
    data: data
  })
}

// 删除课程考试
export function delExercises(id) {
  return request({
    url: '/edu/exercises/' + id,
    method: 'delete'
  })
}
