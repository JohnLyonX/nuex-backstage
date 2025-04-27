import request from '@/utils/request'

// 查询课程章节信息列表
export function listCoursesChapter(query) {
  return request({
    url: '/edu/coursesChapter/list',
    method: 'get',
    params: query
  })
}

// 查询课程章节信息详细
export function getCoursesChapter(id) {
  return request({
    url: '/edu/coursesChapter/' + id,
    method: 'get'
  })
}

// 新增课程章节信息
export function addCoursesChapter(data) {
  return request({
    url: '/edu/coursesChapter',
    method: 'post',
    data: data
  })
}

// 修改课程章节信息
export function updateCoursesChapter(data) {
  return request({
    url: '/edu/coursesChapter',
    method: 'put',
    data: data
  })
}

// 删除课程章节信息
export function delCoursesChapter(id) {
  return request({
    url: '/edu/coursesChapter/' + id,
    method: 'delete'
  })
}
