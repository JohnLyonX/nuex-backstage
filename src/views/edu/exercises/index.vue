<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="课程编号" prop="coursesId">
        <el-input
          v-model="queryParams.coursesId"
          placeholder="请输入课程编号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="课程名称" prop="coursesName">
        <el-input
          v-model="queryParams.coursesName"
          placeholder="请输入课程名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

      <el-form-item label="考试名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入考试名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="部门名称" prop="deptName">
        <treeselect
          v-model="queryParams.deptId"
          :options="deptOptions"
          :normalizer="normalizer"
          placeholder="请选择部门"
          @input="handleDeptChange"
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
          v-hasPermi="['edu:exercises:add']"
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
          v-hasPermi="['edu:exercises:edit']"
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
          v-hasPermi="['edu:exercises:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['edu:exercises:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="exercisesList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="部门名称" align="center" prop="deptName" />
      <el-table-column label="课程名称" align="center" prop="coursesName" />
      <el-table-column label="课程章节" align="center" prop="coursesChapterName" />
      <el-table-column label="考试名称" align="center" prop="name" />
      <el-table-column label="试卷地址" align="center" prop="fileUrl" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edu:exercises:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edu:exercises:remove']"
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

    <!-- 添加或修改课程考试对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="课程名称" prop="coursesName">
          <el-input v-model="form.coursesName" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程章节" prop="coursesChapterName">
          <el-input v-model="form.coursesChapterName" placeholder="请输入课程章节" />
        </el-form-item>
        <el-form-item label="部门名称" prop="deptId">
      <treeselect
        v-model="form.deptId"
        :options="deptOptions"
        :normalizer="normalizer"
        placeholder="请选择部门"
      />
    </el-form-item>
        <el-form-item label="考试名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入考试名称" />
        </el-form-item>
        <el-form-item label="试卷地址" prop="fileUrl">
          <file-upload v-model="form.fileUrl"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listexercises, getexercises, delexercises, addexercises, updateexercises } from "@/api/edu/exercises";
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from "@/api/system/dept";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";

export default {
  name: "exercises",
  components: { Treeselect },
  data() {
    return {
      deptOptions: [], // 部门树选项
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 课程考试表格数据
      exercisesList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
        queryParams: {
        pageNum: 1,
        pageSize: 10,
        coursesId: null,
        coursesName: null,
        coursesChapterName: null,
        name: null,
        fileUrl: null,
        deptId: null,
  deptName: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [
          { required: true, message: "课程考试名称不能为空", trigger: "blur" }
        ],
        deptId: [
          { required: true, message: "请选择所属部门", trigger: "change" }
        ]
      },

    };
  },
  created() {
    this.getList();
    this.getDeptTree(); // 获取部门树
  },
  methods: {
  // 获取部门树数据
  getDeptTree() {
    listDept().then(response => {
      this.deptOptions = this.handleTree(response.data, "deptId");
    });
  },
    // 树结构转换方法
    normalizer(node) {
    if (node.children && !node.children.length) {
      delete node.children;
    }
    return {
      id: node.deptId,
      label: node.deptName,
      children: node.children
    };
  },
  // 递归查找部门
  findDeptById(id, list = this.deptOptions) {
    for (const item of list) {
      if (item.deptId === id) return item;
      if (item.children) {
        const found = this.findDeptById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  }, handleDeptChange(deptId) {
    const dept = this.findDeptById(deptId);
    this.queryParams.deptName = dept ? dept.deptName : '';
  },
    /** 查询课程考试列表 */
    getList() {
      this.loading = true;
      listexercises(this.queryParams).then(response => {
        response.rows.forEach(row => {
          const dept = this.findDeptById(Number(row.deptId));
          row.deptName = dept ? dept.deptName : '';
        });
        this.exercisesList = response.rows;
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
        coursesName: null,
        coursesChapterId: null,
        name: null,
        fileUrl: null,
        deptId: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.queryParams.deptId = null;
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
      this.title = "添加课程考试";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getexercises(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改课程考试";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateexercises(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addexercises(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除课程考试编号为"' + ids + '"的数据项？').then(function() {
        return delexercises(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edu/exercises/export', {
        ...this.queryParams
      }, `exercises_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
