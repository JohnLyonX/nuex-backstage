<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="课程名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入课程名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="课程状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择课程状态" clearable>
          <el-option
            v-for="dict in dict.type.course_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['edu:courses:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['edu:courses:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['edu:courses:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['edu:courses:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="coursesList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="课程名称" align="center" prop="name" />
       <el-table-column label="图片" align="center" prop="url" width="100">
        <template slot-scope="scope">
          <image-preview :src="scope.row.url" :width="50" :height="50"/>
        </template>
      </el-table-column>
      <el-table-column label="课程简介" align="center" prop="summary" />
      <el-table-column label="价格" align="center" prop="price" />
      <el-table-column label="课程状态" align="center" prop="status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.course_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edu:courses:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edu:courses:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改课程对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="图片地址" prop="url">
          <el-input v-model="form.url" placeholder="请输入图片地址" />
        </el-form-item>
        <el-form-item label="课程简介">
          <editor v-model="form.summary" :min-height="192"/>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input v-model="form.price" placeholder="请输入价格" />
        </el-form-item>
        <el-form-item label="教师名称" prop="teacherName">
          <el-input v-model="form.teacherName" placeholder="请输入教师名称" />
        </el-form-item>
        <el-form-item label="课程状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择课程状态">
            <el-option
              v-for="dict in dict.type.course_status"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-divider content-position="center">视频课信息</el-divider>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAddEduCoursesDetails">添加</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteEduCoursesDetails">删除</el-button>
          </el-col>
        </el-row>
        <el-table :data="eduCoursesDetailsList" :row-class-name="rowEduCoursesDetailsIndex" @selection-change="handleEduCoursesDetailsSelectionChange" ref="eduCoursesDetails">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="课程章节标名称" prop="coursesChapterName" width="150" >
            <template slot-scope="scope">
              <el-input v-model="scope.row.coursesChapterName" placeholder="请输入课程章节标名称" />
            </template>
          </el-table-column>
          <el-table-column label="视频课标题" prop="title" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.title" placeholder="请输入视频课标题" />
            </template>
          </el-table-column>
          <el-table-column label="视频课视频地址" prop="videoUrl" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.videoUrl" placeholder="请输入视频课视频地址" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listCourses, getCourses, delCourses, addCourses, updateCourses } from "@/api/edu/courses";

export default {
  name: "Courses",
  dicts: ['course_status'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedEduCoursesDetails: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 课程表格数据
      coursesList: [],
      // 视频课表格数据
      eduCoursesDetailsList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        url: null,
        summary: null,
        price: null,
        teacherName: null,
        status: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询课程列表 */
    getList() {
      this.loading = true;
      listCourses(this.queryParams).then(response => {
        this.coursesList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        name: null,
        url: null,
        summary: null,
        price: null,
        status: null,
        teacherName:null,
        createTime: null,
        updateTime: null
      };
      this.eduCoursesDetailsList = [];
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加课程";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getCourses(id).then(response => {
        this.form = response.data;
        this.eduCoursesDetailsList = response.data.eduCoursesDetailsList;
        this.open = true;
        this.title = "修改课程";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.eduCoursesDetailsList = this.eduCoursesDetailsList;
          if (this.form.id != null) {
            updateCourses(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addCourses(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除课程编号为"' + ids + '"的数据项？').then(function() {
        return delCourses(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 视频课序号 */
    rowEduCoursesDetailsIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 视频课添加按钮操作 */
    handleAddEduCoursesDetails() {
      let obj = {};
      obj.coursesChapterId = "";
      obj.title = "";
      obj.videoUrl = "";
      this.eduCoursesDetailsList.push(obj);
    },
    /** 视频课删除按钮操作 */
    handleDeleteEduCoursesDetails() {
      if (this.checkedEduCoursesDetails.length == 0) {
        this.$modal.msgError("请先选择要删除的视频课数据");
      } else {
        const eduCoursesDetailsList = this.eduCoursesDetailsList;
        const checkedEduCoursesDetails = this.checkedEduCoursesDetails;
        this.eduCoursesDetailsList = eduCoursesDetailsList.filter(function(item) {
          return checkedEduCoursesDetails.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleEduCoursesDetailsSelectionChange(selection) {
      this.checkedEduCoursesDetails = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edu/courses/export', {
        ...this.queryParams
      }, `courses_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
