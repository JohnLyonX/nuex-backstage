<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-form-item label="课程名称" prop="courseName">
        <el-input
          v-model="queryParams.courseName"
          placeholder="请输入课程名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['edu:coursesStudent:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['edu:coursesStudent:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['edu:coursesStudent:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['edu:coursesStudent:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="coursesStudentList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="编号" align="center" prop="id"/>
      <el-table-column label="课程名称" align="center" prop="courseName"/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edu:coursesStudent:edit']"
          >修改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edu:coursesStudent:remove']"
          >删除
          </el-button>
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

    <!-- 添加或修改课堂管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="form.courseName" placeholder="请输入课程名称" disabled/>
        </el-form-item>
        <el-divider content-position="center">课堂管理详情信息</el-divider>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAddEduCoursesStudentDetails">添加
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteEduCoursesStudentDetails">
              删除
            </el-button>
          </el-col>
        </el-row>
        <el-table :data="eduCoursesStudentDetailsList" :row-class-name="rowEduCoursesStudentDetailsIndex"
                  @selection-change="handleEduCoursesStudentDetailsSelectionChange" ref="eduCoursesStudentDetails">
          <el-table-column type="selection" width="50" align="center"/>
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="学生名称" prop="studentName" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.studentName" placeholder="请输入学生名称" disabled/>
            </template>
          </el-table-column>
          <el-table-column label="学生手机号" prop="studentPhoneNumber" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.studentPhoneNumber" placeholder="请输入学生手机号" disabled/>
            </template>
          </el-table-column>
          <el-table-column label="学生性别" prop="studentSex" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.studentSex" placeholder="请输入学生性别" disabled/>
            </template>
          </el-table-column>
          <el-table-column label="学生状态" align="center" prop="studentStatus">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.student_status" :value="scope.row.studentStatus" />
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
import {
  listCoursesStudent,
  getCoursesStudent,
  delCoursesStudent,
  addCoursesStudent,
  updateCoursesStudent
} from "@/api/edu/coursesStudent";

export default {
  name: "CoursesStudent",
  dicts: ['student_status'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedEduCoursesStudentDetails: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 课堂管理表格数据
      coursesStudentList: [],
      // 课堂管理详情表格数据
      eduCoursesStudentDetailsList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        coursesId: null,
        courseName: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        coursesId: [
          {required: true, message: "课程编号不能为空", trigger: "blur"}
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询课堂管理列表 */
    getList() {
      this.loading = true;
      listCoursesStudent(this.queryParams).then(response => {
        this.coursesStudentList = response.rows;
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
        coursesId: null,
        courseName: null
      };
      this.eduCoursesStudentDetailsList = [];
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
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加课堂管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getCoursesStudent(id).then(response => {
        this.form = response.data;
        this.eduCoursesStudentDetailsList = response.data.eduCoursesStudentDetailsList;
        this.open = true;
        this.title = "修改课堂管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.eduCoursesStudentDetailsList = this.eduCoursesStudentDetailsList;
          if (this.form.id != null) {
            updateCoursesStudent(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addCoursesStudent(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除课堂管理编号为"' + ids + '"的数据项？').then(function () {
        return delCoursesStudent(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 课堂管理详情序号 */
    rowEduCoursesStudentDetailsIndex({row, rowIndex}) {
      row.index = rowIndex + 1;
    },
    /** 课堂管理详情添加按钮操作 */
    handleAddEduCoursesStudentDetails() {
      let obj = {};
      obj.studentId = "";
      obj.studentName = "";
      obj.studentPhoneNumber = "";
      obj.studentSex = "";
      obj.studentStatus = "";
      this.eduCoursesStudentDetailsList.push(obj);
    },
    /** 课堂管理详情删除按钮操作 */
    handleDeleteEduCoursesStudentDetails() {
      if (this.checkedEduCoursesStudentDetails.length == 0) {
        this.$modal.msgError("请先选择要删除的课堂管理详情数据");
      } else {
        const eduCoursesStudentDetailsList = this.eduCoursesStudentDetailsList;
        const checkedEduCoursesStudentDetails = this.checkedEduCoursesStudentDetails;
        this.eduCoursesStudentDetailsList = eduCoursesStudentDetailsList.filter(function (item) {
          return checkedEduCoursesStudentDetails.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleEduCoursesStudentDetailsSelectionChange(selection) {
      this.checkedEduCoursesStudentDetails = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edu/coursesStudent/export', {
        ...this.queryParams
      }, `coursesStudent_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
