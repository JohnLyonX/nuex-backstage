<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="学生名字" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入学生名字"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="登陆账号" prop="phoneNumber">
        <el-input
          v-model="queryParams.phoneNumber"
          placeholder="请输入登陆账号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="登陆密码" prop="password">
        <el-input
          v-model="queryParams.password"
          placeholder="请输入登陆密码"
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
          v-hasPermi="['edu:student:add']"
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
          v-hasPermi="['edu:student:edit']"
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
          v-hasPermi="['edu:student:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['edu:student:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="studentList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="学生编号" align="center" prop="id" />
      <el-table-column label="学生名字" align="center" prop="name" />
      <el-table-column label="用户头像" align="center" prop="url" width="100">
        <template slot-scope="scope">
          <image-preview :src="scope.row.url" :width="50" :height="50"/>
        </template>
      </el-table-column>
      <el-table-column label="登陆账号" align="center" prop="phoneNumber" />
      <el-table-column label="登陆密码" align="center" prop="password" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edu:student:edit']"
          >查看</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edu:student:remove']"
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

    <!-- 添加或修改学生基本信息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="学生名字" prop="name">
          <el-input v-model="form.name" placeholder="请输入学生名字" />
        </el-form-item>
         <el-form-item label="用户头像" prop="url">
          <image-upload v-model="form.url"/>
        </el-form-item>
        <el-form-item label="登陆账号" prop="phoneNumber">
          <el-input v-model="form.phoneNumber" placeholder="请输入登陆账号" />
        </el-form-item>
        <el-form-item label="登陆密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入登陆密码" />
        </el-form-item>
        <el-divider content-position="center">学生信息详情信息</el-divider>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAddEduStudentDetails">添加</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteEduStudentDetails">删除</el-button>
          </el-col>
        </el-row>
        <el-table :data="eduStudentDetailsList" :row-class-name="rowEduStudentDetailsIndex" @selection-change="handleEduStudentDetailsSelectionChange" ref="eduStudentDetails">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="学校" prop="school" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.school" placeholder="请输入学校" />
            </template>
          </el-table-column>
          <el-table-column label="专业" prop="major" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.major" placeholder="请输入专业" />
            </template>
          </el-table-column>
          <el-table-column label="年级" prop="grade" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.grade" placeholder="请输入年级" />
            </template>
          </el-table-column>
          <el-table-column label="班级" prop="classinfo" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.classinfo" placeholder="请输入班级" />
            </template>
          </el-table-column>
          <el-table-column label="年龄" prop="age" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.age" placeholder="请输入年龄" />
            </template>
          </el-table-column>
          <el-table-column label="性别" prop="sex" width="150">
            <template slot-scope="scope">
              <el-select v-model="scope.row.sex" placeholder="请选择性别">
                <el-option label="请选择字典生成" value="" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="邮箱" prop="email" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.email" placeholder="请输入邮箱" />
            </template>
          </el-table-column>
          <el-table-column label="代码能力" prop="codeAbility" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.codeAbility" placeholder="请输入代码能力" />
            </template>
          </el-table-column>
          <el-table-column label="学习能力" prop="studyAbility" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.studyAbility" placeholder="请输入学习能力" />
            </template>
          </el-table-column>
          <el-table-column label="逻辑能力" prop="thinkingAbility" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.thinkingAbility" placeholder="请输入逻辑能力" />
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
import { listStudent, getStudent, delStudent, addStudent, updateStudent } from "@/api/edu/student";

export default {
  name: "Student",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedEduStudentDetails: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 学生基本信息表格数据
      studentList: [],
      // 学生信息详情表格数据
      eduStudentDetailsList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        phoneNumber: null,
        password: null,
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
    /** 查询学生基本信息列表 */
    getList() {
      this.loading = true;
      listStudent(this.queryParams).then(response => {
        this.studentList = response.rows;
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
        phoneNumber: null,
        password: null,
        createTime: null,
        updateTime: null
      };
      this.eduStudentDetailsList = [];
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
      this.title = "添加学生基本信息";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getStudent(id).then(response => {
        this.form = response.data;
        this.eduStudentDetailsList = response.data.eduStudentDetailsList;
        this.open = true;
        this.title = "修改学生基本信息";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.eduStudentDetailsList = this.eduStudentDetailsList;
          if (this.form.id != null) {
            updateStudent(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addStudent(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除学生基本信息编号为"' + ids + '"的数据项？').then(function() {
        return delStudent(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 学生信息详情序号 */
    rowEduStudentDetailsIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 学生信息详情添加按钮操作 */
    handleAddEduStudentDetails() {
      let obj = {};
      obj.school = "";
      obj.major = "";
      obj.grade = "";
      obj.classinfo = "";
      obj.age = "";
      obj.sex = "";
      obj.email = "";
      obj.codeAbility = "";
      obj.studyAbility = "";
      obj.thinkingAbility = "";
      this.eduStudentDetailsList.push(obj);
    },
    /** 学生信息详情删除按钮操作 */
    handleDeleteEduStudentDetails() {
      if (this.checkedEduStudentDetails.length == 0) {
        this.$modal.msgError("请先选择要删除的学生信息详情数据");
      } else {
        const eduStudentDetailsList = this.eduStudentDetailsList;
        const checkedEduStudentDetails = this.checkedEduStudentDetails;
        this.eduStudentDetailsList = eduStudentDetailsList.filter(function(item) {
          return checkedEduStudentDetails.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleEduStudentDetailsSelectionChange(selection) {
      this.checkedEduStudentDetails = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edu/student/export', {
        ...this.queryParams
      }, `student_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
