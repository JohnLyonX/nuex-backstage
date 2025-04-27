import request from '@/utils/request'

// 查询课堂管理列表
export function listCoursesStudent(query) {
  return request({
    url: '/edu/coursesStudent/list',
    method: 'get',
    params: query
  })
}

// 查询课堂管理详细
export function getCoursesStudent(id) {
  return request({
    url: '/edu/coursesStudent/' + id,
    method: 'get'
  })
}

// 新增课堂管理
export function addCoursesStudent(data) {
  return request({
    url: '/edu/coursesStudent',
    method: 'post',
    data: data
  })
}

// 修改课堂管理
export function updateCoursesStudent(data) {
  return request({
    url: '/edu/coursesStudent',
    method: 'put',
    data: data
  })
}

// 删除课堂管理
export function delCoursesStudent(id) {
  return request({
    url: '/edu/coursesStudent/' + id,
    method: 'delete'
  })
}
