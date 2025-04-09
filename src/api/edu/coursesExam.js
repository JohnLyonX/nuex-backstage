import request from '@/utils/request'

// 查询课程考试列表
export function listCoursesExam(query) {
  return request({
    url: '/edu/coursesExam/list',
    method: 'get',
    params: query
  })
}

// 查询课程考试详细
export function getCoursesExam(id) {
  return request({
    url: '/edu/coursesExam/' + id,
    method: 'get'
  })
}

// 新增课程考试
export function addCoursesExam(data) {
  return request({
    url: '/edu/coursesExam',
    method: 'post',
    data: data
  })
}

// 修改课程考试
export function updateCoursesExam(data) {
  return request({
    url: '/edu/coursesExam',
    method: 'put',
    data: data
  })
}

// 删除课程考试
export function delCoursesExam(id) {
  return request({
    url: '/edu/coursesExam/' + id,
    method: 'delete'
  })
}
