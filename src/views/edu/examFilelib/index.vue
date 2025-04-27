<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-form-item label="学生姓名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入学生姓名"
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

      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['edu:examFilelib:remove']"
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
          v-hasPermi="['edu:examFilelib:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="examFilelibList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="编号" align="center" prop="id"/>
      <el-table-column label="学生姓名" align="center" prop="name"/>
      <el-table-column label="课程名称" align="center" prop="coursesName"/>
      <el-table-column label="考试名称" align="center" prop="coursesExamName"/>
      <el-table-column label="分数" align="center" prop="score"/>
      <el-table-column label="原试卷" align="center" prop="subPath">
        <template slot-scope="scope">

          <div v-if="scope.row.subPath" class="word-thumbnail">
            <a
              :href="scope.row.subPath | downloadUrl"
              :download="scope.row.subPath ? scope.row.subPath.split('/').pop() : ''"
              style="color: #409EFF; text-decoration: underline; cursor: pointer;"
              target="_blank"
            >
              <img
                src="@/assets/icons/Subject.png"
                alt="Word文档"
                style="
              width: 48px;
              cursor: pointer;
              filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
              transition: filter 0.3s;"
                @mouseover="e => e.target.style.filter = 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.8))'"
                @mouseout="e => e.target.style.filter = 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))'"
              />
            </a>
            <br>
            <span style="font-size: 12px; color: #666;">
              {{ scope.row.subPath.split('/').pop().replace(/_\d+[A-Z]\d+\.docx$/, '') }}
            </span>
          </div>
          <span v-else>暂无</span>
        </template>
      </el-table-column>
      <el-table-column label="批改完成" align="center">
        <template slot-scope="scope">

          <div v-if="scope.row.correctPath" class="word-thumbnail">
            <a
              :href="scope.row.correctPath | downloadUrl"
              :download="scope.row.correctPath ? scope.row.correctPath.split('/').pop() : ''"
              style="color: #409EFF; text-decoration: underline; cursor: pointer;"
              target="_blank"
            >
              <img
                src="@/assets/icons/Subject.png"
                alt="Word文档"
                style="
              width: 48px;
              cursor: pointer;
              filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
              transition: filter 0.3s;"
                @mouseover="e => e.target.style.filter = 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.8))'"
                @mouseout="e => e.target.style.filter = 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))'"
              />
            </a>
            <br>
            <span style="font-size: 12px; color: #666;">
              {{ scope.row.correctPath.split('/').pop().replace(/_\d+[A-Z]\d+\.docx$/, '') }}
            </span>
          </div>
          <span v-else>暂无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            :icon="loadingStates[scope.row.id] ? 'el-icon-loading' : 'el-icon-edit'"
            @click="handleCorrect(scope.row)"
            v-hasPermi="['edu:examFilelib:correct']"
            :disabled="loadingStates[scope.row.id]"
          >{{ loadingStates[scope.row.id] ? '智能管家批改中...' : '智能批改' }}
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['edu:examFilelib:edit']"
          >批改
          </el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['edu:examFilelib:remove']"
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

    <!-- 添加或修改考试试卷提交与修改对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-form-item label="学生姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入学生姓名" disabled/>
        </el-form-item>
        <el-form-item label="课程名称" prop="coursesName">
          <el-input v-model="form.coursesName" placeholder="请输入课程名称" disabled/>
        </el-form-item>

        <el-form-item label="考试名称" prop="coursesExamName">
          <el-input v-model="form.coursesExamName" placeholder="请输入考试名称" disabled/>
        </el-form-item>
        <el-form-item label="分数" prop="score">
          <el-input-number v-model="form.score" :min="0" :max="100" placeholder="请输入分数"/>
        </el-form-item>

        <el-form-item label="原试卷" prop="subPath">
          <div v-if="form.subPath" class="word-thumbnail">
            <a
              :href="form.subPath | downloadUrl"
              :download="form.subPath ? form.subPath.split('/').pop() : ''"
              style="color: #409EFF; text-decoration: underline; cursor: pointer;"
              target="_blank"
            >
              <img
                src="@/assets/icons/Subject.png"
                alt="Word文档"
                style="
              width: 48px;
              cursor: pointer;
              filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
              transition: filter 0.3s;"
                @mouseover="e => e.target.style.filter = 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.8))'"
                @mouseout="e => e.target.style.filter = 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))'"
              />
            </a>
            <br>
            <span style="font-size: 12px; color: #666;">
              {{ form.subPath.split('/').pop().replace(/_\d+[A-Z]\d+\.docx$/, '') }}
            </span>
          </div>
          <span v-else>暂无</span>
        </el-form-item>

        <el-form-item label="批改完成" prop="correctPath">
          <div v-if="form.correctPath" class="word-thumbnail">
            <a
              :href="form.correctPath | downloadUrl"
              :download="form.correctPath ? form.correctPath.split('/').pop() : ''"
              style="color: #409EFF; text-decoration: underline; cursor: pointer;"
              target="_blank"
            >
              <img
                src="@/assets/icons/Subject.png"
                alt="Word文档"
                style="
              width: 48px;
              cursor: pointer;
              filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
              transition: filter 0.3s;"
                @mouseover="e => e.target.style.filter = 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.8))'"
                @mouseout="e => e.target.style.filter = 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))'"
              />
            </a>
            <br>
            <span style="font-size: 12px; color: #666;">
      {{ form.correctPath.split('/').pop().replace(/_\d+[A-Z]\d+\.docx$/, '') }}
    </span>
          </div>
          <span v-else>暂无</span>
          <el-upload
            class="upload-demo"
            :action="'/common/upload' | uploadUrl"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <el-button type="primary">教师自改</el-button>
            <br/>
          </el-upload>
          <span>请上传批改完的文档</span>
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
import {
  listExamFilelib,
  getExamFilelib,
  delExamFilelib,
  addExamFilelib,
  updateExamFilelib
} from "@/api/edu/examFilelib";
import axios from "axios";

export default {
  name: "ExamFilelib",
  data() {
    return {
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
      // 考试试卷提交与修改表格数据
      examFilelibList: [],
      loadingStates: {},
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        studentId: null,
        name: null,
        coursesName: null,
        courseChapterId: null,
        coursesChapter: null,
        subPath: null,
        correctPath: null,
        coursesId: null,
        coursesExamName: null, // 新增：考试名称
        score: null // 新增：分数
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {}
    };
  },
  filters: {
    /**
     * 下载链接
     */
    downloadUrl(url) {
      return (
        process.env.VUE_APP_BASE_API +
        url
      );
    },
    uploadUrl(url) {
      return (
        process.env.VUE_APP_BASE_API +
        url
      );
    }
  },
  computed: {

    baseApi() {
      return process.env.VUE_APP_BASE_API;
    },
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询考试试卷提交与修改列表 */
    getList() {
      this.loading = true;
      listExamFilelib(this.queryParams).then(response => {
        this.examFilelibList = response.rows;
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
        studentId: null,
        name: null,
        coursesName: null,
        subPath: null,
        correctPath: null,
        coursesId: null
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
      this.title = "";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getExamFilelib(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "批改成绩";
      });
    },

    /** 智能批改操作 */
    async handleCorrect(row) {
      try {
        this.$modal.msgSuccess("已提交给智能管家批改");
        this.$set(this.loadingStates, row.id, true);

        await axios.get('/api/correct', {
          // baseURL: 'http://nuemind.nuex.ltd:8081',
          baseURL: 'http://localhost:8081',
          params: {
            fileName: row.subPath,
            id: row.id  // 新增ID参数
          }
        });

        this.$modal.msgSuccess(row.name + " '" + row.coursesExamName + "' 已完成批改");
        this.getList();
      } catch (error) {
        const msg = error.response?.data || error.message;
        this.$modal.msgError(`批改失败: ${msg}`);
      } finally {
        this.$set(this.loadingStates, row.id, false);
      }
    },

    handleUploadSuccess(response) {
      if (response && response.url) {
        this.form.correctPath = response.url; // 替换旧文件
      } else {
        this.$message.error("上传失败，请重试");
      }
    },
    beforeUpload(file) {
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (!isDocx) {
        this.$message.error("只允许上传 .docx 文件！");
      }
      return isDocx;
    },
    removeCorrectFile() {
      this.$confirm('确定要删除当前上传的文件吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        this.form.correctPath = '';
        this.$message.success("已删除");
      }).catch(() => {
      });
    },


    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateExamFilelib(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addExamFilelib(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除考试试卷提交与修改编号为"' + ids + '"的数据项？').then(function () {
        return delExamFilelib(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('edu/examFilelib/export', {
        ...this.queryParams
      }, `examFilelib_${new Date().getTime()}.xlsx`)
    }
  }
}
;
</script>

<style scoped>
.word-thumbnail {
  cursor: pointer;
  padding: 20px 0;
}
</style>
